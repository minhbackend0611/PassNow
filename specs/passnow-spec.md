# PassNow — Specification (SDD)
> Đây là source of truth cho dự án. Đọc toàn bộ trước khi viết bất kỳ dòng code nào.  
> Cập nhật file này khi có thay đổi yêu cầu — không để code và spec lệch nhau.

---

## 1. TỔNG QUAN DỰ ÁN

**PassNow** là web app cho phép sinh viên, người mới đi làm và người thuê trọ
đăng bán, trao đổi hoặc cho tặng đồ cũ trong phạm vi trường học, ký túc xá và
khu vực lân cận.

### Mục tiêu MVP
Xây dựng phiên bản chạy được, đủ để demo trong môn Khởi nghiệp và thử nghiệm
thực tế tại một trường đại học.

### Priority tiers

```
P0 — Must have (MVP không thiếu):
  Authentication (register / login / logout)
  User profile (school + area setup)
  Create / edit / delete listing
  Browse feed (filtered by school/area)
  Search & filter
  Listing detail page
  Free items section

P1 — Should have (hoàn thiện trải nghiệm):
  Transaction confirm flow (buyer + seller cùng confirm)
  Rating & review sau giao dịch

P2 — Nice to have (sau MVP):
  Real-time chat (Firebase Realtime DB)
  GPS auto-detect location
```

---

## 2. TECH STACK

```yaml
frontend:
  framework:      React 18.3
  language:       TypeScript 5.4
  bundler:        Vite 5
  styling:        Tailwind CSS 3.4
  ui_components:  shadcn/ui (Radix UI primitives)
  state:          Zustand 4
  routing:        React Router v6
  forms:          React Hook Form 7 + Zod
  http_client:    Firebase SDK (không dùng REST calls thủ công)
  image_preview:  browser native FileReader API

backend_as_a_service:
  platform:       Firebase 10
  auth:           Firebase Authentication (Email/Password + Email OTP link)
  database:       Cloud Firestore
  storage:        Firebase Storage (ảnh listing)
  realtime:       Firebase Realtime Database (P2 — chat)

deployment:
  hosting:        Firebase Hosting
  ci:             Manual deploy (firebase deploy)

dev_tools:
  linter:         ESLint 8
  formatter:      Prettier 3
  type_check:     tsc --noEmit
```

> **Lý do chọn stack này:**  
> Tailwind + shadcn/ui cho phép dựng UI nhanh mà không cần custom CSS nhiều.  
> Firebase xử lý auth, db, storage trong một SDK duy nhất — phù hợp quy mô môn học.  
> Zustand nhẹ hơn Redux, đủ dùng cho state app này.

---

## 3. KIẾN TRÚC & CẤU TRÚC THƯ MỤC

```
passnow/
├── src/
│   ├── components/          # Shared UI components (Button, Card, Modal…)
│   ├── features/            # Feature-based modules
│   │   ├── auth/            # Register, Login, Profile setup
│   │   ├── listings/        # Create, Edit, Browse, Detail
│   │   ├── search/          # Search + filter
│   │   ├── transactions/    # Confirm flow (P1)
│   │   ├── reviews/         # Rating system (P1)
│   │   └── chat/            # Real-time chat (P2)
│   ├── lib/
│   │   ├── firebase.ts      # Firebase init + exports
│   │   └── utils.ts         # Shared helpers
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript interfaces
│   └── pages/               # Route-level components
├── specs/                   # Spec files (file này nằm đây)
├── .env.local               # Firebase config keys (KHÔNG commit)
└── firestore.rules          # Firestore security rules
```

---

## 4. DATA MODELS (Firestore Schema)

### 4.1 Collection: `users`

```yaml
# Document ID: Firebase Auth UID
users/{userId}:
  uid:           string       # = Firebase Auth UID
  email:         string
  displayName:   string
  avatarUrl:     string | null   # Firebase Storage URL
  school:        string       # Ví dụ: "Đại học Bách Khoa HCM"
  district:      string       # Ví dụ: "Quận 10, TP.HCM"
  locationGPS:                # Optional — P2
    lat:         number | null
    lng:         number | null
  rating:        number       # Average, tính từ reviews. Default: 0
  totalReviews:  number       # Default: 0
  createdAt:     timestamp
```

### 4.2 Collection: `listings`

```yaml
# Document ID: auto-generated
listings/{listingId}:
  id:            string
  sellerId:      string       # users/{userId}
  sellerName:    string       # Denormalized để tránh extra read
  sellerSchool:  string       # Denormalized

  type:          enum         # 'sell' | 'free'
  title:         string       # Max 100 chars
  description:   string       # Max 1000 chars
  price:         number | null  # null nếu type = 'free'
  condition:     enum         # 'new' | 'like_new' | 'good' | 'fair'
  category:      enum         # xem danh sách bên dưới
  images:        string[]     # Firebase Storage URLs, max 5 ảnh

  school:        string       # Copy từ seller.school lúc đăng
  district:      string       # Copy từ seller.district lúc đăng
  locationGPS:                # Optional — P2
    lat:         number | null
    lng:         number | null

  status:        enum         # 'active' | 'reserved' | 'completed' | 'deleted'
  views:         number       # Default: 0
  createdAt:     timestamp
  updatedAt:     timestamp
```

**Category enum:**
```
'books'        → Sách & Tài liệu
'electronics'  → Điện tử
'furniture'    → Nội thất & Gia dụng
'clothing'     → Quần áo & Phụ kiện
'vehicles'     → Xe cộ
'other'        → Khác
```

### 4.3 Collection: `transactions` (P1)

```yaml
# Document ID: auto-generated
transactions/{transactionId}:
  listingId:         string
  listingTitle:      string   # Denormalized
  sellerId:          string
  buyerId:           string
  sellerConfirmed:   boolean  # Default: false
  buyerConfirmed:    boolean  # Default: false
  status:            enum     # 'pending' | 'completed'
  createdAt:         timestamp
  completedAt:       timestamp | null
```

### 4.4 Collection: `reviews` (P1)

```yaml
# Document ID: auto-generated
reviews/{reviewId}:
  transactionId:  string
  listingId:      string
  reviewerId:     string
  revieweeId:     string
  rating:         number     # 1 | 2 | 3 | 4 | 5
  comment:        string     # Optional, max 500 chars
  createdAt:      timestamp
```

### 4.5 Realtime DB: Chat (P2)

```yaml
# Firebase Realtime Database (tách khỏi Firestore)
chats/{conversationId}:
  metadata:
    participants:
      {userId1}: true
      {userId2}: true
    listingId:     string
    lastMessage:   string
    lastMessageAt: number    # Unix timestamp
  messages/{messageId}:
    senderId:   string
    text:       string
    createdAt:  number       # Unix timestamp
```

> **Convention:** `conversationId` = sort([userId1, userId2]).join('_') + '_' + listingId

---

## 5. FIRESTORE SECURITY RULES

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: chỉ đọc public, chỉ tự sửa profile của mình
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Listings: ai cũng đọc được, chỉ chủ sở hữu mới sửa/xóa
    match /listings/{listingId} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.sellerId == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.sellerId == request.auth.uid;
    }

    // Transactions: chỉ buyer và seller liên quan
    match /transactions/{transactionId} {
      allow read: if request.auth != null
        && (resource.data.sellerId == request.auth.uid
            || resource.data.buyerId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null
        && (resource.data.sellerId == request.auth.uid
            || resource.data.buyerId == request.auth.uid);
    }

    // Reviews: ai cũng đọc, chỉ người trong transaction mới viết
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.reviewerId == request.auth.uid;
    }
  }
}
```

---

## 6. ROUTE MAP

```
/                     → Trang chủ / Feed (redirect login nếu chưa auth)
/auth/register        → Đăng ký
/auth/login           → Đăng nhập
/auth/setup-profile   → Chọn trường + khu vực (sau register)
/listings             → Browse all listings
/listings/new         → Tạo listing mới
/listings/:id         → Chi tiết listing
/listings/:id/edit    → Chỉnh sửa listing (chỉ owner)
/profile/:userId      → Trang cá nhân (xem)
/profile/me           → Profile của bản thân (edit)
/transactions         → Danh sách giao dịch của tôi (P1)
/chat                 → Danh sách conversation (P2)
/chat/:conversationId → Chi tiết conversation (P2)
```

---

## 7. BDD SPECIFICATIONS

### FEATURE 1 — Authentication

#### Scenario 1.1: Đăng ký tài khoản mới

```gherkin
Scenario: Sinh viên đăng ký thành công
  Given người dùng chưa có tài khoản
  When người dùng nhập email hợp lệ, password >= 8 ký tự và confirm password khớp
  And bấm "Đăng ký"
  Then Firebase Auth tạo tài khoản mới
  And hệ thống gửi email xác thực đến địa chỉ đã nhập
  And chuyển hướng đến /auth/setup-profile
  And document users/{uid} được tạo với rating=0, totalReviews=0

Scenario: Email đã tồn tại
  Given người dùng nhập email đã được đăng ký
  When bấm "Đăng ký"
  Then hiển thị lỗi "Email này đã được sử dụng"
  And không tạo tài khoản mới

Scenario: Password không hợp lệ
  Given người dùng nhập password < 8 ký tự
  Or confirm password không khớp
  When bấm "Đăng ký"
  Then hiển thị lỗi inline ngay tại field tương ứng
  And không gửi request lên Firebase
```

#### Scenario 1.2: Đăng nhập

```gherkin
Scenario: Đăng nhập thành công
  Given người dùng đã có tài khoản
  When nhập đúng email + password
  And bấm "Đăng nhập"
  Then Firebase Auth trả về user session
  And chuyển hướng về trang trước đó (hoặc / nếu không có)

Scenario: Sai password
  Given người dùng nhập password không đúng
  When bấm "Đăng nhập"
  Then hiển thị lỗi "Email hoặc mật khẩu không đúng"
  And không tiết lộ field nào bị sai (bảo mật)
```

#### Scenario 1.3: Thiết lập profile lần đầu

```gherkin
Scenario: Hoàn thành setup profile
  Given người dùng vừa đăng ký, đang ở /auth/setup-profile
  When nhập displayName (bắt buộc)
  And chọn school từ input text (bắt buộc)
  And chọn district từ input text (bắt buộc)
  And upload avatar (tùy chọn)
  And bấm "Hoàn tất"
  Then users/{uid} được update với thông tin trên
  And chuyển hướng về /

Scenario: Bỏ qua upload avatar
  Given người dùng không upload avatar
  When bấm "Hoàn tất"
  Then users/{uid}.avatarUrl = null
  And profile vẫn được tạo thành công
```

---

### FEATURE 2 — Listing Management

#### Scenario 2.1: Tạo listing mới

```gherkin
Scenario: Đăng bán đồ thành công
  Given người dùng đã đăng nhập
  When vào /listings/new
  And chọn type = 'sell'
  And nhập title (bắt buộc, max 100 ký tự)
  And nhập description (bắt buộc, max 1000 ký tự)
  And nhập price > 0 (bắt buộc khi type = 'sell')
  And chọn condition (bắt buộc)
  And chọn category (bắt buộc)
  And upload ít nhất 1 ảnh (bắt buộc, max 5 ảnh, mỗi ảnh max 5MB)
  And bấm "Đăng tin"
  Then ảnh được upload lên Firebase Storage tại listings/{listingId}/
  Then document listings/{listingId} được tạo với status='active'
  And listing.school = currentUser.school
  And listing.district = currentUser.district
  And chuyển hướng về /listings/{listingId}

Scenario: Đăng cho tặng miễn phí
  Given người dùng chọn type = 'free'
  Then field "Giá" bị ẩn/disabled
  And listing.price = null khi lưu

Scenario: Thiếu thông tin bắt buộc
  Given người dùng không nhập title hoặc thiếu ảnh
  When bấm "Đăng tin"
  Then hiển thị validation error tại field thiếu
  And không gửi request lên Firebase

Scenario: Ảnh quá lớn
  Given người dùng upload ảnh > 5MB
  Then hiển thị lỗi "Ảnh không được vượt quá 5MB"
  And ảnh đó không được thêm vào danh sách
```

#### Scenario 2.2: Chỉnh sửa listing

```gherkin
Scenario: Chủ listing chỉnh sửa thành công
  Given người dùng là owner của listing
  And listing.status = 'active'
  When vào /listings/:id/edit
  And thay đổi thông tin
  And bấm "Lưu thay đổi"
  Then listings/{id} được update
  And listings/{id}.updatedAt = now()

Scenario: Người khác cố vào trang edit
  Given người dùng KHÔNG phải owner
  When truy cập /listings/:id/edit
  Then redirect về /listings/:id
  And hiển thị thông báo "Bạn không có quyền chỉnh sửa tin này"
```

#### Scenario 2.3: Xóa listing

```gherkin
Scenario: Xóa listing thành công
  Given người dùng là owner
  When bấm "Xóa tin" và confirm dialog
  Then listings/{id}.status = 'deleted'
  And listing không hiển thị trên feed nữa
  And ảnh trong Firebase Storage vẫn giữ nguyên (không xóa ngay)

  # Note: soft delete — không xóa document thật để giữ transaction history
```

---

### FEATURE 3 — Browse & Discovery

#### Scenario 3.1: Feed trang chủ

```gherkin
Scenario: Xem feed mặc định
  Given người dùng đã đăng nhập, đã có school + district
  When vào /
  Then hiển thị listings có status='active'
  And ưu tiên hiển thị listing cùng school trước
  And sau đó đến listing cùng district
  And sau cùng là các listing khác
  And sắp xếp theo createdAt descending trong mỗi nhóm
  And hiển thị tối đa 20 listing mỗi lần (pagination hoặc infinite scroll)

Scenario: Xem tab "Cho tặng miễn phí"
  Given người dùng bấm tab "Miễn phí"
  Then chỉ hiển thị listings có type='free' và status='active'
  And giữ nguyên logic ưu tiên vị trí
```

#### Scenario 3.2: Search & Filter

```gherkin
Scenario: Tìm kiếm theo từ khóa
  Given người dùng nhập keyword vào search box
  When bấm Enter hoặc bấm icon search
  Then lọc listings có title chứa keyword (case-insensitive)
  # Note: Firestore không hỗ trợ full-text search native.
  # MVP: dùng Firestore query với >= và <= trick trên title field.
  # Nếu cần nâng cao sau: tích hợp Algolia hoặc Typesense.

Scenario: Filter theo category
  Given người dùng chọn category từ dropdown
  Then chỉ hiển thị listings có category = giá trị đã chọn

Scenario: Filter theo price range
  Given người dùng nhập giá từ và giá đến
  Then chỉ hiển thị listings có price >= giá_từ và price <= giá_đến
  And listings type='free' hiển thị khi giá_từ = 0

Scenario: Filter theo condition
  Given người dùng chọn condition
  Then chỉ hiển thị listings có condition = giá trị đã chọn

Scenario: Kết hợp nhiều filter
  Given người dùng áp dụng category + price range cùng lúc
  Then chỉ hiển thị listings thỏa MỌI điều kiện
  And hiển thị số lượng kết quả

Scenario: Không có kết quả
  Given bộ lọc không khớp với listing nào
  Then hiển thị empty state: "Không tìm thấy kết quả phù hợp"
  And có nút "Xóa bộ lọc" để reset
```

---

### FEATURE 4 — Listing Detail

#### Scenario 4.1: Xem chi tiết listing

```gherkin
Scenario: Xem listing của người khác
  Given bất kỳ người dùng nào (kể cả chưa đăng nhập)
  When vào /listings/:id
  Then hiển thị: tất cả ảnh (carousel), title, type badge, price/Free badge,
       condition, category, description, school, district, createdAt
  Then hiển thị thông tin người bán: avatar, displayName, rating, totalReviews
  Then listings/{id}.views += 1
  And nút "Liên hệ người bán" hiển thị (yêu cầu đăng nhập khi bấm)

Scenario: Owner xem listing của mình
  Given người dùng là owner
  When vào /listings/:id
  Then hiển thị nút "Chỉnh sửa" và "Xóa" thay vì "Liên hệ"
  And hiển thị số lượt xem

Scenario: Xem listing đã xóa / completed
  Given listings/{id}.status = 'deleted' hoặc 'completed'
  Then hiển thị thông báo "Tin đăng này đã kết thúc"
  And không hiển thị nút liên hệ
```

---

### FEATURE 5 — User Profile

#### Scenario 5.1: Xem profile người khác

```gherkin
Scenario: Xem profile public
  Given bất kỳ người dùng đăng nhập
  When vào /profile/:userId
  Then hiển thị: avatar, displayName, school, district, rating, totalReviews
  And hiển thị danh sách listings active của user đó
```

#### Scenario 5.2: Chỉnh sửa profile của mình

```gherkin
Scenario: Cập nhật thông tin cá nhân
  Given người dùng ở /profile/me
  When thay đổi displayName, school, district hoặc avatar
  And bấm "Lưu"
  Then users/{uid} được update
  And avatar mới được upload lên Firebase Storage tại avatars/{uid}
  And ảnh avatar cũ bị xóa (nếu có)
```

---

### FEATURE 6 — Transaction Confirm (P1)

#### Scenario 6.1: Buyer gửi yêu cầu giao dịch

```gherkin
Scenario: Buyer muốn mua / nhận đồ
  Given listing.status = 'active'
  And người dùng KHÔNG phải owner
  When bấm "Tôi muốn mua" (hoặc "Tôi muốn nhận" với free item)
  Then tạo document transactions/{transactionId} với:
       sellerId = listing.sellerId
       buyerId = currentUser.uid
       sellerConfirmed = false
       buyerConfirmed = false
       status = 'pending'
  And listings/{id}.status → 'reserved'
  And seller nhận được notification (có thể là in-app badge, không cần push)

Scenario: Buyer hủy yêu cầu trước khi seller confirm
  Given transaction.status = 'pending' và sellerConfirmed = false
  When buyer bấm "Hủy"
  Then transaction bị xóa
  And listings/{id}.status → 'active'
```

#### Scenario 6.2: Cả hai bên confirm hoàn tất

```gherkin
Scenario: Seller confirm đã bàn giao đồ
  Given transaction tồn tại
  When seller bấm "Xác nhận đã bàn giao"
  Then transactions/{id}.sellerConfirmed = true

Scenario: Buyer confirm đã nhận đồ
  Given seller đã confirm
  When buyer bấm "Xác nhận đã nhận"
  Then transactions/{id}.buyerConfirmed = true
  And transactions/{id}.status = 'completed'
  And transactions/{id}.completedAt = now()
  And listings/{id}.status = 'completed'
  And cả hai bên được nhắc để lại đánh giá

Scenario: Chỉ một bên confirm, bên kia chưa
  Given sellerConfirmed = true, buyerConfirmed = false (hoặc ngược lại)
  Then transaction.status vẫn = 'pending'
  And listing.status vẫn = 'reserved'
```

---

### FEATURE 7 — Rating & Review (P1)

#### Scenario 7.1: Đánh giá sau giao dịch

```gherkin
Scenario: Buyer đánh giá seller
  Given transaction.status = 'completed'
  And buyer chưa đánh giá seller trong transaction này
  When buyer chọn rating (1-5 sao) và nhập comment (tùy chọn)
  And bấm "Gửi đánh giá"
  Then tạo reviews/{reviewId} với reviewerId=buyer, revieweeId=seller
  And users/{sellerId}.rating = (tổng rating mới) / (totalReviews + 1)
  And users/{sellerId}.totalReviews += 1

Scenario: Seller đánh giá buyer
  Given transaction.status = 'completed'
  When seller đánh giá buyer tương tự
  Then tạo reviews/{reviewId} với reviewerId=seller, revieweeId=buyer
  And users/{buyerId}.rating được cập nhật

Scenario: Đánh giá trùng
  Given người dùng đã đánh giá trong transaction này
  When cố đánh giá lại
  Then hiển thị thông báo "Bạn đã đánh giá giao dịch này rồi"
  And không cho phép tạo review mới
```

---

### FEATURE 8 — Real-time Chat (P2)

#### Scenario 8.1: Nhắn tin giữa buyer và seller

```gherkin
Scenario: Mở conversation từ listing detail
  Given người dùng bấm "Liên hệ người bán" trên /listings/:id
  Then tạo hoặc tìm conversation với id = sort([uid, sellerId]).join('_') + '_' + listingId
  And chuyển hướng về /chat/{conversationId}

Scenario: Gửi tin nhắn
  Given người dùng đang ở /chat/:conversationId
  When nhập text và bấm Enter (hoặc nút Gửi)
  Then message được push vào Realtime DB tại chats/{conversationId}/messages/
  And cả hai người nhìn thấy message real-time (không cần refresh)
  And metadata.lastMessage và lastMessageAt được cập nhật

Scenario: Xem danh sách conversation
  Given người dùng vào /chat
  Then hiển thị tất cả conversation có uid của mình trong participants
  And sắp xếp theo lastMessageAt descending
```

---

## 8. UI/UX REQUIREMENTS

### Layout chung
- Responsive: mobile-first (360px → 768px → 1280px)
- Navigation: Bottom nav bar trên mobile, Side nav hoặc Top nav trên desktop
- Theme: Tailwind default + có thể thêm brand color (xem bên dưới)

### Brand color (đề xuất)
```css
--color-primary:    #16A34A;  /* Green-600 — tượng trưng cho bền vững, tái sử dụng */
--color-secondary:  #F59E0B;  /* Amber-500 — năng động, dành cho CTA phụ */
--color-surface:    #F9FAFB;  /* Gray-50 */
--color-text:       #111827;  /* Gray-900 */
```

### Component patterns
- Listing card: ảnh thumbnail, title (2 dòng truncate), price/Free badge, school badge, condition badge
- Empty states: luôn có icon + mô tả + action button
- Loading: skeleton loader (không dùng spinner toàn màn hình)
- Error states: inline error message, không dùng alert() native browser
- Toast notifications: dùng shadcn/ui Sonner cho success/error feedback

### Form validation
- Validate realtime khi người dùng rời khỏi field (onBlur)
- Hiển thị error message bên dưới field tương ứng
- Disable submit button khi form chưa valid
- Không reset form sau khi submit lỗi

---

## 9. NON-FUNCTIONAL REQUIREMENTS

```yaml
performance:
  initial_load:       < 3s trên 3G (dùng code splitting + lazy loading)
  image_optimization: compress trước khi upload (client-side, max 1MB sau compress)
  firestore_reads:    tránh unbounded queries — luôn dùng limit()

security:
  auth_required:      /listings/new, /profile/me, /transactions, /chat
  public_routes:      /, /listings, /listings/:id, /profile/:userId, /auth/*
  firestore_rules:    enforce server-side (không tin tưởng client-side check)
  env_vars:           Firebase config trong .env.local, không commit lên git

ux:
  listing_images:     preview trước khi upload
  loading_states:     mọi async action đều có loading indicator
  offline:            hiển thị thông báo khi mất kết nối
  accessibility:      semantic HTML, keyboard navigable, contrast ratio đạt WCAG AA
```

---

## 10. KNOWN LIMITATIONS (MVP)

```
1. Search: Firestore không hỗ trợ full-text search.
   MVP dùng prefix match trên title field.
   → Giải pháp nâng cao: Algolia / Typesense integration (sau MVP)

2. Location filtering: MVP dùng exact string match trên school và district field.
   → GPS-based proximity search: P2

3. Push notifications: MVP không có.
   → Có thể thêm Firebase Cloud Messaging sau

4. Image compression: thực hiện client-side bằng browser Canvas API.
   → Giới hạn: không compress được trên iOS Safari cũ

5. Pagination: dùng Firestore cursor-based pagination (startAfter).
   → Không hỗ trợ jump đến page cụ thể

6. No payment gateway: mọi giao dịch tiền mặt, ngoài app.
```

---

## 11. DEVELOPMENT CHECKLIST

Trước mỗi feature, agent phải:
- [ ] Đọc BDD scenario tương ứng trong file này
- [ ] Kiểm tra TypeScript types trong `src/types/`
- [ ] Match code style của các file đã có trong cùng feature folder
- [ ] Viết component test (nếu có logic phức tạp)
- [ ] Không sửa file ngoài scope của feature đang làm
- [ ] Update file này nếu phát hiện spec thiếu hoặc mâu thuẫn với thực tế

---

*Phiên bản: 1.0 — PassNow MVP Spec*  
*Dự án môn Khởi nghiệp*
