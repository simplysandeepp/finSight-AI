"""Executive PDF report generation using reportlab."""

from __future__ import annotations

from datetime import datetime
from io import BytesIO
from typing import Any, Dict


def build_executive_pdf(prediction_result: Dict[str, Any]) -> bytes:
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
        from reportlab.pdfgen import canvas
    except Exception as exc:
        raise RuntimeError('reportlab is required for PDF generation') from exc

    result = prediction_result or {}
    rec = ((result.get('result') or {}).get('recommendation') or {})
    fc = ((result.get('result') or {}).get('final_forecast') or {})
    conf = ((result.get('explainability') or {}).get('confidence_breakdown') or {})
    
    # Extract additional data
    company_id = result.get('company_id', 'N/A')
    trace_id = result.get('trace_id', 'N/A')
    model_version = result.get('model_version', 'N/A')
    combined_confidence = result.get('result', {}).get('combined_confidence', 0)
    degraded_agents = result.get('degraded_agents', [])

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, 
        pagesize=A4, 
        title='FinSight AI Executive Report',
        author='FinSight AI Platform',
        subject=f'Financial Forecast Report for {company_id}',
        leftMargin=0.75*inch,
        rightMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles for better formatting
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading1_style = ParagraphStyle(
        'CustomHeading1',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#0f766e'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#0891b2'),
        spaceAfter=10,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        textColor=colors.HexColor('#334155'),
        alignment=TA_JUSTIFY,
        spaceAfter=8,
        leading=14
    )
    
    info_style = ParagraphStyle(
        'InfoStyle',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=colors.HexColor('#64748b'),
        alignment=TA_LEFT,
        spaceAfter=6
    )
    
    story = []

    # Cover Page
    story.append(Spacer(1, 1.5*inch))
    story.append(Paragraph('FinSight AI', title_style))
    story.append(Paragraph('Executive Forecast Report', heading1_style))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(f'<b>Company:</b> {company_id}', info_style))
    story.append(Paragraph(f'<b>Generated:</b> {datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")}', info_style))
    story.append(Paragraph(f'<b>Report ID:</b> {trace_id[:16]}...', info_style))
    story.append(Paragraph(f'<b>Model Version:</b> {model_version}', info_style))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph('<i>CONFIDENTIAL - For Internal Use Only</i>', ParagraphStyle('Confidential', parent=styles['Italic'], alignment=TA_CENTER, textColor=colors.HexColor('#dc2626'))))
    story.append(PageBreak())

    # Table of Contents
    story.append(Paragraph('Table of Contents', heading1_style))
    story.append(Spacer(1, 0.2*inch))
    toc_data = [
        ['Section', 'Page'],
        ['1. Executive Summary', '3'],
        ['2. Forecast Overview', '3'],
        ['3. Confidence Analysis', '4'],
        ['4. Agent Performance Breakdown', '4'],
        ['5. Risk Factors', '5'],
        ['6. Methodology & Disclaimer', '5'],
    ]
    toc_table = Table(toc_data, colWidths=[4*inch, 1*inch])
    toc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f766e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
    ]))
    story.append(toc_table)
    story.append(PageBreak())

    # 1. Executive Summary
    story.append(Paragraph('1. Executive Summary', heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    action = rec.get('action', 'monitor').upper()
    action_color = {
        'BUY': colors.HexColor('#10b981'),
        'SELL': colors.HexColor('#ef4444'),
        'HOLD': colors.HexColor('#f59e0b'),
        'MONITOR': colors.HexColor('#6366f1')
    }.get(action, colors.HexColor('#6b7280'))
    
    story.append(Paragraph(f'<b>Recommended Action:</b> <font color="{action_color.hexval()}"><b>{action}</b></font>', body_style))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(rec.get('simple_summary', 'No summary available.'), body_style))
    story.append(Spacer(1, 0.2*inch))

    # 2. Forecast Overview
    story.append(Paragraph('2. Forecast Overview', heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    forecast_data = [
        ['Metric', 'P05 (Low)', 'P50 (Median)', 'P95 (High)', 'Unit'],
        [
            'Revenue', 
            f"{(fc.get('revenue_ci') or [0, 0])[0]:.2f}", 
            f"{fc.get('revenue_p50', 0):.2f}", 
            f"{(fc.get('revenue_ci') or [0, 0])[1]:.2f}",
            'M USD'
        ],
        [
            'EBITDA', 
            f"{(fc.get('ebitda_ci') or [0, 0])[0]:.2f}", 
            f"{fc.get('ebitda_p50', 0):.2f}", 
            f"{(fc.get('ebitda_ci') or [0, 0])[1]:.2f}",
            'M USD'
        ],
    ]
    
    forecast_table = Table(forecast_data, colWidths=[1.5*inch, 1.2*inch, 1.2*inch, 1.2*inch, 0.8*inch])
    forecast_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f766e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
    ]))
    story.append(forecast_table)
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph('<i>Note: P05, P50, and P95 represent the 5th, 50th (median), and 95th percentile forecasts respectively.</i>', info_style))
    story.append(Spacer(1, 0.2*inch))

    # 3. Confidence Analysis
    story.append(Paragraph('3. Confidence Analysis', heading1_style))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(f'<b>Combined System Confidence:</b> {combined_confidence * 100:.2f}%', body_style))
    
    if degraded_agents:
        story.append(Paragraph(f'<b><font color="#dc2626">Warning:</font></b> The following agents experienced issues: {", ".join(degraded_agents)}', body_style))
    else:
        story.append(Paragraph('<b><font color="#10b981">Status:</font></b> All agents performed successfully.', body_style))
    
    story.append(Spacer(1, 0.2*inch))

    # 4. Agent Performance Breakdown
    story.append(Paragraph('4. Agent Performance Breakdown', heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    agent_data = [
        ['Agent Name', 'Confidence Score', 'Status'],
        ['Transcript NLP', f"{(conf.get('transcript_nlp') or 0) * 100:.1f}%", '✓' if 'transcript_nlp' not in degraded_agents else '✗'],
        ['Financial Model', f"{(conf.get('financial_model') or 0) * 100:.1f}%", '✓' if 'financial_model' not in degraded_agents else '✗'],
        ['News & Macro', f"{(conf.get('news_macro') or 0) * 100:.1f}%", '✓' if 'news_macro' not in degraded_agents else '✗'],
        ['Competitor Analysis', f"{(conf.get('competitor') or 0) * 100:.1f}%", '✓' if 'competitor' not in degraded_agents else '✗'],
    ]
    
    agent_table = Table(agent_data, colWidths=[2.5*inch, 2*inch, 1.5*inch])
    agent_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1d4ed8')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
    ]))
    story.append(agent_table)
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph('<i>Each agent contributes specialized analysis to the final forecast. Higher confidence indicates stronger signal quality.</i>', info_style))
    story.append(PageBreak())

    # 5. Risk Factors
    story.append(Paragraph('5. Risk Factors', heading1_style))
    story.append(Spacer(1, 0.1*inch))
    risk_factors = rec.get('risk_factors', [])
    if risk_factors:
        for i, risk in enumerate(risk_factors, 1):
            story.append(Paragraph(f'{i}. {risk}', body_style))
    else:
        story.append(Paragraph('No specific risk factors identified in this analysis.', body_style))
    story.append(Spacer(1, 0.2*inch))

    # 6. Methodology & Disclaimer
    story.append(Paragraph('6. Methodology & Disclaimer', heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    methodology_text = """
    This report is generated by the FinSight AI platform, which employs a multi-agent ensemble approach 
    to financial forecasting. The system analyzes earnings transcripts, financial statements, news sentiment, 
    macroeconomic indicators, and competitive dynamics to produce probabilistic forecasts.
    """
    story.append(Paragraph(methodology_text, body_style))
    story.append(Spacer(1, 0.1*inch))
    
    disclaimer_text = """
    <b>IMPORTANT DISCLAIMER:</b> This report is generated by an artificial intelligence system and is intended 
    for research and informational purposes only. It should NOT be used as the sole basis for investment decisions. 
    Past performance does not guarantee future results. All forecasts are subject to uncertainty and may not 
    materialize. Please consult with qualified financial advisors before making any investment decisions. 
    The creators and operators of FinSight AI assume no liability for decisions made based on this report.
    """
    story.append(Paragraph(disclaimer_text, ParagraphStyle('Disclaimer', parent=body_style, textColor=colors.HexColor('#dc2626'), fontSize=9)))

    # Footer function
    def _footer(canvas_obj, doc_obj):
        canvas_obj.saveState()
        canvas_obj.setFont('Helvetica', 8)
        canvas_obj.setFillColor(colors.HexColor('#64748b'))
        canvas_obj.drawString(0.75*inch, 0.5*inch, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
        canvas_obj.drawRightString(A4[0] - 0.75*inch, 0.5*inch, f"Trace ID: {trace_id[:24]}... | v{model_version}")
        canvas_obj.drawCentredString(A4[0] / 2, 0.5*inch, f"Page {doc_obj.page}")
        canvas_obj.restoreState()

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    return buf.getvalue()
