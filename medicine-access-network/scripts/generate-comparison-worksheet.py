"""Regenerate the blank public worksheet with Python + reportlab (no user data)."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

out = Path(__file__).resolve().parents[1] / 'public/downloads/TFN-facilitator-comparison.pdf'
c = canvas.Canvas(str(out), pagesize=(612, 792), invariant=1)
c.setTitle('TFN | Facilitator comparison worksheet')
c.setAuthor('The Facilitator Network')
style = ParagraphStyle('body', fontName='Helvetica', fontSize=9, leading=12, textColor=HexColor('#283c35'))

def para(text, x, y, width, bold=False):
    p = Paragraph(text, style)
    _, h = p.wrap(width, 200)
    p.drawOn(c, x, y-h)
    return h

pages = [
 ('Service and practical fit', [
 ('Proposed service & scope', 'What is included? What is not? Is this preparation, integration, or another service?'),
 ('Qualifications & checks', 'Record claimed training/license, issuing body, and a source to check independently. A claim is not verification.'),
 ('Format & location eligibility', 'In person or online? Where may this person provide this exact service? Confirm your location is eligible.'),
 ('Fees & duration', 'Session length, total price/currency, required extras, and any ongoing commitment.'),
 ('Cancellation & refunds', 'Notice required, cancellation charges, deposits, and refund terms.')]),
 ('Consent, privacy and next steps', [
 ('Consent & boundaries', 'How can you decline, pause or stop? Ask about touch, confidentiality limits and professional boundaries.'),
 ('Privacy & contact', 'What information is requested, who can see it, how is it kept, and which contact method can you use?'),
 ('Scope limits & referrals', 'What is outside their role? How do they handle concerns or refer someone to appropriate support?'),
 ('Unanswered questions', 'What needs clarification in writing? Note any pressure, vague claims or terms you do not understand.'),
 ('Your next step', 'Compare answers, verify claims, ask more, or decide not to proceed. There is no obligation to choose.')])]
for number, (subtitle, rows) in enumerate(pages, 1):
    c.setFillColor(HexColor('#174c3c')); c.setFont('Helvetica-Bold', 11)
    c.drawString(36, 754, 'THE FACILITATOR NETWORK')
    c.setFont('Helvetica-Bold', 20); c.drawString(36, 722, 'Compare before you choose')
    c.setFont('Helvetica', 11); c.drawString(36, 701, f'{number}. {subtitle}')
    para('Blank worksheet for private notes. Print both pages and label each option consistently. Do not add health history or other sensitive personal information.', 36, 681, 540)
    widths = [172, 184, 184]; xs = [36, 208, 392, 576]; top=638
    c.setFillColor(HexColor('#edf3ef')); c.rect(36, top-37, 540, 37, fill=1, stroke=0)
    for i, text in enumerate(['Questions to compare', 'Option A: ____________', 'Option B: ____________']):
        para(f'<b>{text}</b>', xs[i]+9, top-10, widths[i]-18)
    y = top-37
    c.setStrokeColor(HexColor('#8a9992')); c.setLineWidth(.5)
    for label, hint in rows:
        para(f'<b>{label}</b><br/>{hint}', 45, y-9, 154)
        c.line(36, y, 576, y); y-=94
    c.line(36, y, 576, y)
    for x in xs: c.line(x, top, x, y)
    c.line(36, top, 576, top)
    para('This is a comparison aid, not a safety score, provider verification or clinical endorsement. A directory listing does not establish qualifications or legality. Confirm the proposed service is permitted where it takes place.', 36, 115, 540)
    c.setFont('Helvetica', 8); c.setFillColor(HexColor('#283c35'))
    c.drawString(36, 54, 'thefacilitatornetwork.com/resources/questions-to-ask')
    c.drawRightString(576, 54, f'{number} / 2')
    c.showPage()
c.save()
print(out)
