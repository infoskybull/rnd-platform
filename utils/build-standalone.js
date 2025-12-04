// Build script để tạo file HTML standalone (có thể chạy từ file://)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, "dist");
const HTML_FILE = path.join(DIST_DIR, "index.html");
const ASSETS_DIR = path.join(DIST_DIR, "assets");

console.log("🔨 Building standalone HTML file...\n");

// Đọc file HTML
let html = fs.readFileSync(HTML_FILE, "utf-8");

// Tìm tất cả các file JS trong assets
const jsFiles = fs
  .readdirSync(ASSETS_DIR)
  .filter((file) => file.endsWith(".js"));

if (jsFiles.length === 0) {
  console.error("❌ Không tìm thấy file JS trong assets!");
  process.exit(1);
}

console.log(`📦 Tìm thấy ${jsFiles.length} file JS:`);
jsFiles.forEach((file) => console.log(`   - ${file}`));

// Đọc và inline tất cả JS files
let allJsCode = "";
jsFiles.forEach((file) => {
  const jsPath = path.join(ASSETS_DIR, file);
  const jsCode = fs.readFileSync(jsPath, "utf-8");
  allJsCode += `\n/* ${file} */\n${jsCode}\n`;
  console.log(`✅ Đã đọc: ${file} (${(jsCode.length / 1024).toFixed(2)} KB)`);
});

// Escape các ký tự đặc biệt trong JS code để tránh conflict với HTML
// QUAN TRỌNG: Phải escape các thẻ HTML đóng để tránh trình duyệt hiểu nhầm
// Vấn đề: Khi JavaScript code có string literal chứa "</body>" hoặc "</script>",
// trình duyệt sẽ hiểu nhầm đó là thẻ đóng HTML thật sự
// Giải pháp: Escape TẤT CẢ pattern </ thành <\/ (kể cả trong string literals)

// Bước 1: Escape tất cả các pattern </...>
// Sử dụng split/join để đảm bảo escape TẤT CẢ các trường hợp
// Cách này đảm bảo escape cả trong string literals
const beforeEscape = allJsCode;
allJsCode = allJsCode.split("</").join("<\\/");

// Kiểm tra xem escape có hoạt động không
if (allJsCode.includes("</")) {
  console.warn("⚠️  Cảnh báo: Vẫn còn pattern </ sau khi escape!");
  // Force escape lại bằng nhiều cách
  allJsCode = allJsCode.replace(/<\//g, "<\\/");
  // Lặp lại cho đến khi không còn pattern </
  let iterations = 0;
  while (allJsCode.includes("</") && iterations < 10) {
    allJsCode = allJsCode.replace(/<\//g, "<\\/");
    iterations++;
  }
}

// Bước 2: Escape <!-- và --> để tránh conflict với HTML comments
allJsCode = allJsCode.split("<!--").join("<\\!--");
allJsCode = allJsCode.split("-->").join("--\\>");

// Bước 3: Kiểm tra lại một lần nữa
if (allJsCode.includes("</")) {
  console.error(
    "❌ Lỗi: Vẫn còn pattern </ chưa được escape sau tất cả các bước!"
  );
  console.error(
    "   Số lượng pattern </ còn lại:",
    (allJsCode.match(/<\//g) || []).length
  );
}

// Tạo inline script - không dùng CDATA vì không hoạt động trong HTML5
// Chỉ cần escape </script> là đủ
const inlineScript = `<script>
${allJsCode}
</script>`;

// Thay thế script tag bằng inline script
const scriptRegex = /<script[^>]*src=["'][^"']*\.js["'][^>]*><\/script>/gi;
html = html.replace(scriptRegex, "");

// Xóa thẻ script type="module" nếu còn
html = html.replace(/<script[^>]*type=["']module["'][^>]*>/gi, "");

// Thêm script vào cuối body (sau khi DOM ready)
// QUAN TRỌNG: Chỉ thay thế </body> cuối cùng (thẻ đóng HTML thật)
// Không thay thế </body> trong code JavaScript đã được escape
const lastBodyIndex = html.lastIndexOf("</body>");
if (lastBodyIndex === -1) {
  console.error("❌ Không tìm thấy thẻ </body> trong HTML!");
  process.exit(1);
}
html =
  html.substring(0, lastBodyIndex) +
  inlineScript +
  "\n" +
  html.substring(lastBodyIndex);

// Lưu file HTML mới
const outputFile = path.join(DIST_DIR, "index-standalone.html");
fs.writeFileSync(outputFile, html, "utf-8");

console.log(`\n✨ Đã tạo file standalone: index-standalone.html`);
console.log(`📊 Kích thước: ${(html.length / 1024).toFixed(2)} KB`);
console.log(`\n🎮 Bạn có thể mở file này trực tiếp từ file system!`);
console.log(`   File: ${outputFile}\n`);
