<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I need a simple asset manager for my company for keepin the record for IT assets. Provide me a full framework to build this. Above provided excel sheet is my assets for now based on that i need to build a webapp to make the work easier. Please generate a wireframe for building this. In this i need a image to text converter, when i add an image of the assets details like serial number, model, and other need to fetch the text and add to respective field. So make me a wireframe .md file to build this

You can build this as a small Django + PostgreSQL web app with separate modules for hardware categories and an OCR-powered “Add by Image” flow. Below is a wireframe-style framework in Markdown that you can drop into a `docs/asset_manager_wireframe.md` file in your repo.[^1][^2]

***

```markdown
# IT Asset Manager – Wireframe & Architecture

## 1. Goals & Scope

- Centralize all IT assets (desktop, laptop, mobile, tablet, etc.) into a single web app, replacing the current Excel workflow.[file:1]
- Allow quick asset create/update/search by user, department, serial number, model, and location.[file:1]
- Provide an “Add via Image” feature that reads text (serial, model, etc.) from a photo and pre-fills the asset form using OCR.[web:7][web:10]
- Maintain history (auditing) for changes and assignments.

---

## 2. Tech Stack

- Backend: Django (class-based views or DRF + simple templates/React later).[web:2][web:9]
- DB: PostgreSQL (existing familiarity, good for relational asset data and indexing).
- Frontend: Django templates + HTMX/Alpine.js or basic React (optional).
- OCR: Python + Tesseract (via `pytesseract` or `image-text-reader` library).[web:7][web:10]
- Storage: Local or S3-compatible for asset photos and documents.

---

## 3. Core Entities & Database Schema

### 3.1 Normalization Strategy

- Separate tables for:
  - Asset (generic base)
  - AssetType (Desktop, Laptop, Mobile, Tablet, Monitor, Peripheral, etc.)
  - User (person assigned – not auth user initially)
  - Department
  - Location (HQ, branches, etc.)
  - Vendor (optional)
  - Assignment / History (who had what, when)
- Keep specific fields like IMEI, OTP mobile number only where relevant (e.g., mobile assets).[file:1][web:8][web:11]

### 3.2 Tables (High-Level)

**AssetType**
- id
- name (Desktop, Laptop, Mobile, Tablet, Monitor, Peripheral, Other)
- description

**Department**
- id
- name (Finance, Purchase, Creative, IT, HR, etc.)[file:1]
- code (optional)

**Location**
- id
- name (Maylaa HO, warehouse, branches, etc.)[file:1]
- address (optional)

**Person**
- id
- full_name
- email
- department (FK -> Department)
- location (FK -> Location)
- role (Owner, Staff, etc.)

**Asset (base)**
- id
- asset_tag (internal fixed asset code; e.g., TC-000018, optional but recommended)[file:1]
- asset_type (FK -> AssetType)
- make (Dell, HP, Apple, Samsung, Motorola, etc.)[file:1]
- model (Optiplex 7010, iPhone 15 Pro Max, Galaxy A32, etc.)[file:1]
- model_number (A3106, SM-A166P/DS, etc.)[file:1]
- serial_number (S/N)
- part_number (for desktops/monitor where relevant)[file:1]
- status (In Use, In Stock, Repair, Retired, Lost)
- purchase_date
- cost (optional)
- warranty_expiry (optional)
- os (Windows 10 PRO, WIN 11 PRO, macOS Sonoma, Android, iOS, etc.)[file:1]
- os_key (for Windows license key, if tracked)[file:1]
- office_key (for MS Office, if tracked)[file:1]
- cpu (where relevant – desktops/laptops)
- gpu (where relevant)
- ram (e.g., 8GB, 16GB)
- storage (e.g., 512GB SSD, 1TB HDD)
- color (for mobiles)
- assigned_to (FK -> Person, nullable)
- department (FK -> Department, nullable)
- location (FK -> Location)
- otp_mobile_number (for mobiles if applicable)[file:1]
- google_apple_account (for mobiles – email or Apple ID)[file:1]
- comments / notes
- created_at / updated_at

**MobileDetails (extension table, optional)**
- asset (OneToOne -> Asset)
- imei1
- imei2
- ram (if you want separate from base)
- rom
- sim_number / otp_mobile_number (if you separate)

**Peripherals / Monitors / Extra**
Option 1: keep inside Asset with prefixes (monitor_make, monitor_model, monitor_sn, keyboard_make, etc.).[file:1]  
Option 2: separate Asset records for each physical device and link them via Assignment or a “bundle” concept.

Given your current sheet, start with simple columns on Asset:
- monitor_make, monitor_model, monitor_sn, monitor_size
- keyboard_make, keyboard_model, keyboard_sn
- mouse_make, mouse_model, mouse_sn

**AssignmentHistory**
- id
- asset (FK -> Asset)
- person (FK -> Person)
- department (FK -> Department)
- location (FK -> Location)
- assigned_on
- unassigned_on (nullable)
- reason (New assignment, Reassignment, Returned, Repair, etc.)

**AssetImage**
- id
- asset (FK -> Asset, nullable for “pre-create” uploads)
- image_file (path)
- processed_text (text from OCR)
- created_at
- processed_at
- ocr_status (Pending, Success, Failed)
- ocr_engine (Tesseract, etc.)

---

## 4. User Roles & Permissions

- Admin (IT):
  - Full CRUD on assets, people, departments, locations.
  - Configure OCR settings.
- Editor (Power user e.g., IT support, purchase):
  - Add/edit assets, upload images, run OCR.
- Viewer (Finance, HR, Management):
  - Read-only access, export lists.

Integrate later with Django auth & groups.

---

## 5. Main User Flows & Screens (Wireframes)

### 5.1 Dashboard

**Route:** `/`

**Content:**
- Summary cards:
  - Total assets, assets in use, in stock, in repair, retired.
  - Breakdown by type (Desktop, Laptop, Mobile, etc.).
- Recent activity:
  - Last 10 assignments/changes.
- Quick links:
  - “Add Asset”
  - “Add via Image”
  - “View All Assets”
  - “Import from Excel”

### 5.2 Asset List

**Route:** `/assets/`

**Filters & Search:**
- Search box: serial number, asset tag, make, model, user, IMEI.[file:1]
- Filters:
  - Asset type
  - Status
  - Department
  - Location
  - OS
- Pagination.

**Table Columns (examples):**
- Asset Tag
- Type
- Make
- Model
- Serial Number
- User
- Department
- Location
- Status
- Actions (View / Edit)

### 5.3 Asset Detail

**Route:** `/assets/{id}/`

**Sections:**
- Asset summary: type, make, model, serial, asset tag, status.
- Hardware details: CPU, RAM, storage, GPU, OS, license keys.[file:1]
- Assignment info: current user, department, location.
- Mobile info (if type = Mobile/Tablet): IMEI1, IMEI2, OTP number, Google/Apple account.[file:1]
- Linked images:
  - Thumbnails of uploaded images.
  - Button: “Re-run OCR” on a selected image.
- History:
  - Table of AssignmentHistory + key field changes.

### 5.4 Add Asset (Manual Form)

**Route:** `/assets/new/`

**Fields (grouped):**

- Basic:
  - Asset Type (select)
  - Asset Tag
  - Make
  - Model
  - Model Number
  - Serial Number
  - Part Number
  - Status

- Hardware:
  - CPU
  - GPU
  - RAM
  - Storage
  - OS
  - OS Key
  - Office Key

- Mobile-specific (visible when Asset Type = Mobile/Tablet):
  - IMEI1
  - IMEI2
  - RAM
  - ROM
  - OTP Mobile Number
  - Color
  - Google/Apple Account

- Assignment:
  - Assigned To (Person select)
  - Department
  - Location

- Peripherals:
  - Monitor Make/Model/SN/Size
  - Keyboard Make/Model/SN
  - Mouse Make/Model/SN

- Attachments:
  - Upload images.
  - Checkbox “Run OCR on uploaded images”.

Submit buttons:
- “Save”
- “Save & Add Another”

### 5.5 Edit Asset

**Route:** `/assets/{id}/edit/`

- Same as Add Asset with pre-populated values.
- Display list of existing images with:
  - “Run OCR” button per image.
  - Option “Use OCR suggestions” → overlay or sidebar with detected fields you can accept into the form.

---

## 6. Image-to-Text (OCR) Flow

### 6.1 High-Level Design

- Use Tesseract OCR via `pytesseract` or `image-text-reader`:
  - On upload, store image in `AssetImage`.
  - Run OCR in a background task (Celery/RQ) or synchronous for first version.[web:7][web:10]
  - Pre-process image: grayscale, contrast enhancement, resizing for better accuracy.[web:7][web:10]
- Parse extracted text to detect:
  - Serial Number (patterns like long alphanumeric or known vendor prefixes).
  - Model / Model Number.
  - IMEI for mobiles.
  - OS type or other cues.

### 6.2 OCR Upload Screen

**Route:** `/ocr-upload/` or `/assets/new/from-image/`

**Wireframe:**

1. Step 1 – Upload:
   - Field: “Asset Type” (optional at this step).
   - File input: one or multiple images.
   - Button: “Upload and Extract”.

2. Step 2 – OCR Results:
   - Show raw extracted text in textarea (readonly).
   - Highlight guesses for:
     - Serial Number
     - Model
     - Model Number
     - IMEI1, IMEI2 (if numbers match 15-digit patterns)
   - Button: “Continue to Form”.

3. Step 3 – Prefilled Asset Form:
   - Reuse Add Asset form.
   - Pre-fill relevant fields with OCR guesses.
   - User can edit/confirm before saving.

### 6.3 Field Mapping Logic (Conceptual)

- Serial number:
  - Heuristic: lines containing “S/N”, “SN”, “Serial”, or vendor patterns (e.g., Dell, HP).
- Model / Model Number:
  - Look for lines with model names like “Optiplex 7040”, “SM-A166P/DS”, “A3106”, etc.[file:1]
- IMEI:
  - Detect 15-digit numeric sequences, possibly labeled “IMEI1” / “IMEI2”.[file:1]
- Asset Type:
  - Optionally infer from text (e.g., “iPhone”, “Galaxy”, “Optiplex”), but for reliability, let the user choose.

Store the full OCR text in `AssetImage.processed_text` for audit and future parsing improvements.

---

## 7. Excel Import (One-Time & Ongoing)

**Route:** `/import/excel/`

- File upload:
  - Accept your current Excel format (sheets Desktop, MobileTablet, etc.).[file:1]
- Mapping:
  - For v1, hard-code mappings from well-known columns (Sr No, Purchase date, User, Department, Make, Model, S/N, etc.) to Asset fields.[file:1]
  - Validate:
    - Required fields: make, model, or serial.
    - Optional: auto-create Person, Department, Location if not existing.
- Preview:
  - Show first 10 rows with mapping.
- Import:
  - On submit, create Asset and Person records, plus initial AssignmentHistory.

---

## 8. API Design (Optional/For Future)

Use Django REST Framework if you want SPA or integrations.

### 8.1 Endpoints

- `/api/assets/` (GET, POST)
- `/api/assets/{id}/` (GET, PUT, PATCH, DELETE)
- `/api/assets/{id}/images/` (GET, POST)
- `/api/assets/{id}/history/` (GET)
- `/api/ocr/` (POST: image file → returns parsed fields)
- `/api/departments/`, `/api/locations/`, `/api/persons/`

---

## 9. Security & Audit Considerations

- Authentication: Django auth with mandatory login for all actions.
- Authorization: Django groups/permissions per role.
- Audit:
  - Track who created/updated assets.
  - Store change logs (e.g., django-simple-history) for critical fields like serial, user, department, location.
- PII:
  - Emails and phone numbers are stored; restrict exports and access carefully.

---

## 10. Implementation Milestones

1. **MVP DB + CRUD**
   - Define models: AssetType, Department, Location, Person, Asset, AssignmentHistory.
   - Basic admin + simple templates for list/add/edit.

2. **Excel Import**
   - Implement single-file import for your current Excel structure.
   - Validate and load desktop + mobile data.[file:1]

3. **OCR Integration**
   - Add AssetImage model + image upload.
   - Integrate Tesseract OCR.
   - Simple regex-based parsing for serial, model, IMEI.

4. **UX Polish**
   - Dashboard with counts and filters.
   - Inline “Add via Image” button and prefilled forms.

5. **Refinements**
   - Per-type forms (desktop vs mobile).
   - Background tasks for OCR and bulk imports.
   - Reporting/export to CSV.

---
```

If you want, next step I can convert this into a Django model skeleton (with fields tuned precisely to your current Excel columns for Desktop and MobileTablet) so you can scaffold the project quickly.
<span style="display:none">[^10][^11][^3][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: IT-Asset-New-3.xlsx

[^2]: https://github.com/dalasidaho/asset_management

[^3]: https://snipeitapp.com

[^4]: https://virima.com/blog/top-open-source-it-asset-management-software

[^5]: https://www.cloudquery.io/learning-center/open-source-asset-inventory

[^6]: https://www.reddit.com/r/sysadmin/comments/18nfh6l/best_open_source_asset_management_system/

[^7]: https://www.geeksforgeeks.org/python/text-detection-and-extraction-using-opencv-and-ocr/

[^8]: https://www.spritle.com/blog/mastering-best-practices-in-database-schema-design/

[^9]: https://www.tech-artists.org/t/open-source-python-asset-management-system/1266

[^10]: https://pypi.org/project/image-text-reader/

[^11]: https://www.fntsoftware.com/en/blog/industry-expertise-how-utilities-can-build-a-reliable-asset-database

