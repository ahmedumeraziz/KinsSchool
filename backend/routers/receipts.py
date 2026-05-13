from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from utils.auth import get_current_user
from utils.sheets import gas_insert
from models.schemas import Receipt
from reportlab.lib.pagesizes import A5
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import io, time

router = APIRouter()
_receipts: list = []

@router.get("")
async def get_receipts(user=Depends(get_current_user)):
    return {"receipts": _receipts}

@router.post("")
async def create_receipt(data: Receipt, user=Depends(get_current_user)):
    record = {**data.model_dump(), "id": int(time.time())}
    _receipts.insert(0, record)
    await gas_insert("Receipts", record)
    return {"receipt": record}

@router.get("/{receipt_id}/pdf")
async def receipt_pdf(receipt_id: str, user=Depends(get_current_user)):
    receipt = next((r for r in _receipts if str(r.get("id")) == receipt_id), None)
    if not receipt:
        from fastapi import HTTPException
        raise HTTPException(404, "Receipt not found")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A5, rightMargin=20, leftMargin=20, topMargin=20, bottomMargin=20)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>KINS SCHOOL</b>", styles["Title"]))
    story.append(Paragraph("Ratta Rd, Kins St, Gujranwala", styles["Normal"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"Receipt #: {receipt.get('receiptNo')} | Date: {receipt.get('date')}", styles["Normal"]))
    story.append(Spacer(1, 10))

    info = [
        ["Student:", receipt.get("studentName", "")],
        ["Class:",   receipt.get("class_", "")],
    ]
    t = Table(info, colWidths=[80, 260])
    t.setStyle(TableStyle([("FONTSIZE", (0,0), (-1,-1), 9), ("BOTTOMPADDING", (0,0), (-1,-1), 4)]))
    story.append(t)
    story.append(Spacer(1, 10))

    fee_rows = [["Description", "Amount", "Status"]]
    for m in receipt.get("paidMonths", []):
        fee_rows.append([f"{m} Fee", "—", "Paid"])
    if receipt.get("paperFundPaid", 0):
        fee_rows.append(["Paper Fund", str(receipt["paperFundPaid"]), "Paid"])
    fee_rows.append(["Total Paid", f"Rs. {receipt.get('totalPaid', 0):,.0f}", ""])
    fee_rows.append(["Remaining Balance", f"Rs. {receipt.get('remaining', 0):,.0f}", ""])

    ft = Table(fee_rows, colWidths=[180, 100, 60])
    ft.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0), colors.HexColor("#1B4FD8")),
        ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("BACKGROUND",  (0, -2), (-1, -2), colors.HexColor("#ECFDF5")),
        ("BACKGROUND",  (0, -1), (-1, -1), colors.HexColor("#FEF2F2")),
        ("FONTNAME",    (0, -2), (-1, -1), "Helvetica-Bold"),
    ]))
    story.append(ft)
    doc.build(story)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Receipt-{receipt_id}.pdf"'}
    )
