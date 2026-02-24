"""Generate minimal valid placeholder PDF templates.

Run once:  python templates/generate_placeholders.py
"""

import os

# Minimal valid PDF (one blank page with a title)
def make_pdf(title: str) -> bytes:
    """Generate a tiny valid PDF with a single page showing the title."""
    # Using raw PDF operators for a minimal file (no external deps)
    content = f"BT /F1 24 Tf 72 700 Td ({title}) Tj ET"
    stream = content.encode("latin-1")
    objects = []

    # Object 1: Catalog
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj")
    # Object 2: Pages
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj")
    # Object 3: Page
    objects.append(
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R "
        b"/MediaBox [0 0 612 792] "
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj"
    )
    # Object 4: Content stream
    objects.append(
        b"4 0 obj\n<< /Length " + str(len(stream)).encode() + b" >>\nstream\n"
        + stream + b"\nendstream\nendobj"
    )
    # Object 5: Font
    objects.append(
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj"
    )

    body = b"%PDF-1.4\n"
    offsets = []
    for obj in objects:
        offsets.append(len(body))
        body += obj + b"\n"

    xref_start = len(body)
    xref = b"xref\n0 6\n"
    xref += b"0000000000 65535 f \n"
    for off in offsets:
        xref += f"{off:010d} 00000 n \n".encode()

    trailer = (
        b"trailer\n<< /Size 6 /Root 1 0 R >>\n"
        b"startxref\n" + str(xref_start).encode() + b"\n%%EOF\n"
    )

    return body + xref + trailer


TEMPLATES = {
    "MASTER_APP.pdf": "Master Application - Placeholder",
    "DATA_GATHERING_TOOL.pdf": "Data Gathering Tool - Placeholder",
    "CENSUS_TEMPLATE.pdf": "Census Template - Placeholder",
    "COMMISSION_ACK.pdf": "Commission Acknowledgement - Placeholder",
    "ENROLLMENT_FORM.pdf": "Enrollment Form - Placeholder",
}

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    for filename, title in TEMPLATES.items():
        path = os.path.join(script_dir, filename)
        with open(path, "wb") as f:
            f.write(make_pdf(title))
        print(f"Created {path}")
