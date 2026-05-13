from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from utils.auth import get_current_user
from utils.sheets import gas_insert, gas_get_all
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import io, time

router = APIRouter()
_results: list = []

def calc_grade(pct: float) -> str:
    if pct >= 90: return "A+"
    if pct >= 80: return "A"
    if pct >= 70: return "B+"
    if pct >= 60: return "B"
    if pct >= 50: return "C"
    if pct >= 40: return "D"
    return "F"

@router.get("")
async def get_results(user=Depends(get_current_user)):
    remote = await gas_get_all("Results")
    return {"results": remote if remote else _results}

@router.post("")
async def save_result(data: dict, user=Depends(get_current_user)):
    subjects = data.get("subjects", [])
    total_max = sum(s.get("max", 0) for s in subjects)
    total_obt = sum(s.get("obtained", 0) for s in subjects)
    pct = round((total_obt / total_max) * 100, 1) if total_max else 0
    grade = calc_grade(pct)
    record = {
        **data,
        "id": int(time.time()),
        "totalMax": total_max,
        "totalObt": total_obt,
        "percentage": pct,
        "grade": grade,
        "pass": pct >= 40,
    }
    _results.insert(0, record)
    await gas_insert("Results", {k: str(v) for k, v in record.items() if not isinstance(v, list)})
    return {"result": record}

@router.get("/{result_id}/pdf")
async def result_pdf(result_id: str, user=Depends(get_current_user)):
    result = next((r for r in _results if str(r.get("id")) == result_id), None)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(404, "Result not found")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=25, leftMargin=25, topMargin=25, bottomMargin=25)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>KINS SCHOOL</b>", styles["Title"]))
    story.append(Paragraph("Ratta Rd, Kins St, Gujranwala", styles["Normal"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"<b>{result.get('exam', '')} — {result.get('year', '')}</b>", styles["Heading2"]))
    story.append(Spacer(1, 10))

    info = [
        ["Student:", result.get("studentName", "—"), "Class:", result.get("class_", result.get("class", "—"))],
    ]
    it = Table(info, colWidths=[80, 180, 60, 140])
    it.setStyle(TableStyle([("FONTSIZE", (0,0), (-1,-1), 9), ("BOTTOMPADDING", (0,0), (-1,-1), 4)]))
    story.append(it)
    story.append(Spacer(1, 12))

    rows = [["Subject", "Max Marks", "Obtained", "Percentage", "Grade"]]
    for s in result.get("subjects", []):
        sub_pct = round((s["obtained"] / s["max"]) * 100, 1) if s["max"] else 0
        rows.append([s["name"], str(int(s["max"])), str(int(s["obtained"])), f"{sub_pct}%", calc_grade(sub_pct)])
    rows.append(["TOTAL", str(result.get("totalMax", 0)), str(result.get("totalObt", 0)),
                 f"{result.get('percentage', 0)}%", result.get("grade", "")])

    mt = Table(rows, colWidths=[180, 80, 80, 80, 60])
    mt.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0), colors.HexColor("#1B4FD8")),
        ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
        ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#F8FAFF")]),
        ("BACKGROUND",  (0, -1), (-1, -1), colors.HexColor("#EFF6FF")),
        ("FONTNAME",    (0, -1), (-1, -1), "Helvetica-Bold"),
        ("ALIGN",       (1, 0), (-1, -1), "CENTER"),
    ]))
    story.append(mt)
    story.append(Spacer(1, 12))

    summary = [
        ["Result:", "PASS" if result.get("pass") else "FAIL",
         "Grade:", result.get("grade", ""), "Percentage:", f"{result.get('percentage', 0)}%"]
    ]
    st = Table(summary, colWidths=[70, 70, 50, 70, 80, 80])
    st.setStyle(TableStyle([
        ("FONTNAME", (0,0), (-1,-1), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 10),
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#ECFDF5")),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ]))
    story.append(st)

    if result.get("remarks"):
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<b>Teacher Remarks:</b> {result['remarks']}", styles["Normal"]))

    doc.build(story)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Result-{result_id}.pdf"'})
