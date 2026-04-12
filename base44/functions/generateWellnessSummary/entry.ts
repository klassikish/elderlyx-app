import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check premium
    const users = await base44.entities.User.list();
    const userRecord = users.find(u => u.email === user.email);
    if (userRecord?.subscription_plan !== 'premium') {
      return Response.json(
        { error: 'Wellness reports are a Premium feature' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { senior_name, days = 7 } = body;

    if (!senior_name) {
      return Response.json({ error: 'Missing senior_name' }, { status: 400 });
    }

    // Get data from last N days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Fetch visit playback records
    const playbacks = await base44.entities.VisitPlayback.filter(
      { senior_name },
      '-visit_date',
      50
    );
    const recentPlaybacks = playbacks.filter(
      p => new Date(p.visit_date) >= cutoffDate
    );

    // Fetch independence assessments
    const assessments = await base44.entities.IndependenceAssessment.filter(
      { senior_name },
      '-created_date',
      20
    );
    const recentAssessments = assessments.filter(
      a => new Date(a.created_date) >= cutoffDate
    );

    // Fetch activity logs
    const activities = await base44.entities.ActivityLog.filter(
      { senior_name },
      '-created_date',
      50
    );
    const recentActivities = activities.filter(
      a => new Date(a.created_date) >= cutoffDate
    );

    // Prepare context for AI
    const analysisPrompt = `
Analyze the following senior care data for ${senior_name} over the past ${days} days and provide:

VISIT SUMMARIES:
${recentPlaybacks.map(p => `
- Date: ${p.visit_date}
- Eating: ${p.eating}
- Mobility: ${p.mobility}
- Mood: ${p.mood}
- Medication: ${p.medication_taken ? 'Yes' : 'No'}
- Confusion: ${p.confusion_observed ? 'Yes' : 'No'}
- Notes: ${p.notes || 'None'}
`).join('\n')}

INDEPENDENCE ASSESSMENTS:
${recentAssessments.map(a => `
- Date: ${a.created_date}
- Mobility: ${a.mobility_score}/5
- Cognition: ${a.cognition_score}/5
- Daily Living: ${a.daily_living_score}/5
- Safety: ${a.safety_score}/5
- Engagement: ${a.engagement_score}/5
- Total Score: ${a.total_score}/100
`).join('\n')}

ACTIVITY LOG:
${recentActivities.slice(0, 10).map(a => `- ${a.title}: ${a.content || ''}`).join('\n')}

Please provide:
1. KEY TRENDS (eating patterns, mobility changes, mood patterns)
2. POTENTIAL CONCERNS (medication compliance, confusion episodes, falls risk)
3. POSITIVE OBSERVATIONS (improvements, consistent activities)
4. RECOMMENDED ACTIVITIES (to improve well-being, mobility, engagement)
5. NEXT STEPS FOR CAREGIVERS

Format as a professional wellness report suitable for family members.
`;

    // Call AI for analysis
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      model: 'gpt_5_mini',
    });

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text('Weekly Wellness Summary', 20, yPos);
    yPos += 15;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Care Report for: ${senior_name}`, 20, yPos);
    yPos += 5;
    doc.text(`Period: Last ${days} days`, 20, yPos);
    yPos += 5;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 15;

    // Analysis content - word wrap the AI response
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    const splitText = doc.splitTextToSize(analysis, pageWidth - 40);
    splitText.forEach((line) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 20, yPos);
      yPos += 6;
    });

    // Footer
    yPos = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Elderlyx Wellness Report - Confidential', 20, yPos);

    // Generate PDF as blob and convert to base64
    const pdfData = doc.output('arraybuffer');
    const pdfBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(pdfData)));

    return Response.json({
      success: true,
      pdf_base64: pdfBase64,
      filename: `wellness-summary-${senior_name}-${new Date().toISOString().split('T')[0]}.pdf`,
      analysis_summary: analysis.substring(0, 200) + '...',
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});