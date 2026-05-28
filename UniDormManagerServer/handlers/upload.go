package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/middleware"
)

// 上传配置（写死，简单；以后要环境变量化再扩）
const (
	uploadDir     = "./uploads"
	maxUploadSize = 5 << 20 // 5 MiB
)

// allowedMime 允许的 MIME → 扩展名映射。用嗅探的 MIME 决定扩展，不信前端 Content-Type。
var allowedMime = map[string]string{
	"image/jpeg":      ".jpg",
	"image/png":       ".png",
	"image/gif":       ".gif",
	"image/webp":      ".webp",
	"application/pdf": ".pdf",
}

// UploadHandler 文件上传处理器
type UploadHandler struct{}

// NewUploadHandler 创建文件上传处理器
func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

// UploadFile POST /api/upload  multipart/form-data, field: file
//
// 行为:
//   - 限制 body 大小到 5MiB+1KiB
//   - 嗅探 MIME（http.DetectContentType 读前 512 字节），仅允许 image/* + pdf
//   - 落盘到 ./uploads/<YYYY-MM-DD>/<32 hex>.<ext>
//   - 返回 { url, filename, size, mime }
func (h *UploadHandler) UploadFile(c *gin.Context) {
	// 包一层 MaxBytesReader：超大请求在读 form 时就立即报错
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadSize+1024)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "invalid_request",
			"缺少 file 字段或文件过大（限 5MiB）")
		return
	}
	defer file.Close()

	if header.Size > maxUploadSize {
		middleware.WriteError(c, http.StatusRequestEntityTooLarge, "file_too_large",
			"文件超过 5MiB 限制")
		return
	}

	// 嗅探 MIME
	buf := make([]byte, 512)
	n, _ := file.Read(buf)
	mime := http.DetectContentType(buf[:n])
	if _, err := file.Seek(0, 0); err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "文件读取失败")
		return
	}

	ext, ok := allowedMime[strings.ToLower(mime)]
	if !ok {
		middleware.WriteError(c, http.StatusUnsupportedMediaType, "unsupported_type",
			"仅支持 jpg/png/gif/webp/pdf，实际类型: "+mime)
		return
	}

	// 路径: ./uploads/<YYYY-MM-DD>/<32 hex>.<ext>
	dayDir := time.Now().Format("2006-01-02")
	if err := os.MkdirAll(filepath.Join(uploadDir, dayDir), 0o755); err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "上传目录创建失败")
		return
	}
	idBytes := make([]byte, 16)
	if _, err := rand.Read(idBytes); err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "文件名生成失败")
		return
	}
	filename := hex.EncodeToString(idBytes) + ext
	relPath := filepath.ToSlash(filepath.Join(dayDir, filename))
	fullPath := filepath.Join(uploadDir, relPath)

	out, err := os.Create(fullPath)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "文件创建失败")
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		os.Remove(fullPath)
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "文件写入失败")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":      "/uploads/" + relPath,
		"filename": filename,
		"size":     header.Size,
		"mime":     mime,
	})
}
