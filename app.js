const fileInput = document.getElementById('fileInput')
const subtitleHeightInput = document.getElementById('subtitleHeight')
const fontSizeInput = document.getElementById('fontSize')
const fillColorInput = document.getElementById('fillColor')
const strokeColorInput = document.getElementById('strokeColor')
const fontFamilySelect = document.getElementById('fontFamily')
const fontWeightSelect = document.getElementById('fontWeight')
const subtitleTextArea = document.getElementById('subtitleText')
const generateBtn = document.getElementById('generateBtn')
const saveBtn = document.getElementById('saveBtn')
const preview = document.getElementById('preview')
const toast = document.getElementById('toast')

let image = null
let originalName = 'image'
let canvas = null

function showToast(text) {
  toast.textContent = text
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 1600)
}

function ensureCanvas(w, h) {
  if (!canvas) {
    canvas = document.createElement('canvas')
    preview.innerHTML = ''
    preview.appendChild(canvas)
  }
  canvas.width = w
  canvas.height = h
  canvas.style.maxWidth = '100%'
  canvas.style.height = 'auto'
  canvas.style.display = 'block'
  return canvas.getContext('2d')
}

function parseLines(raw) {
  return raw
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

function hexColorValid(hex) {
  return /^#([0-9A-Fa-f]{6})$/.test(hex)
}

function generate() {
  if (!image) {
    showToast('请先选择图片')
    return
  }
  const subtitleHeight = parseInt(subtitleHeightInput.value, 10)
  const fontSize = parseInt(fontSizeInput.value, 10)
  const fillColor = fillColorInput.value
  const strokeColor = strokeColorInput.value
  const fontFamily = fontFamilySelect.value
  const fontWeight = fontWeightSelect.value
  if (!(subtitleHeight > 0) || !(fontSize > 0)) {
    showToast('参数非法')
    return
  }
  if (!hexColorValid(fillColor) || !hexColorValid(strokeColor)) {
    showToast('颜色格式需为 #RRGGBB')
    return
  }
  const lines = parseLines(subtitleTextArea.value)
  if (lines.length === 0) {
    showToast('请输入字幕内容')
    return
  }
  if (lines.length > 10) {
    showToast('字幕行数建议 ≤ 10 行')
    return
  }

  const ctx = ensureCanvas(image.naturalWidth, image.naturalHeight)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0)

  const fontSpec = `${fontWeight} ${fontSize}px ${fontFamily}, "PingFang SC", "Microsoft YaHei", Arial, system-ui`
  ctx.font = fontSpec
  const measured = lines.map(t => ctx.measureText(t).width)
  const maxTextWidth = Math.max(...measured)
  const paddingX = 24
  const paddingY = Math.max(0, Math.floor((subtitleHeight - fontSize) / 2))
  const backgroundWidth = maxTextWidth + paddingX * 2
  const spacing = 12
  const bottomSafe = 24
  const sideSafe = 24
  const maxAllowedWidth = canvas.width - sideSafe * 2
  if (backgroundWidth > maxAllowedWidth) {
    showToast('文本过长，请缩短或减小字体')
    return
  }
  // 垂直占比校验：字幕区域不超过图片高度的 40%
  const totalSubtitleHeight = lines.length * subtitleHeight + (lines.length - 1) * spacing + bottomSafe
  if (totalSubtitleHeight > canvas.height * 0.4) {
    showToast('字幕区域过高，请减少行数或降低字幕高度')
    return
  }

  const startY = canvas.height - bottomSafe - subtitleHeight
  const startX = Math.round((canvas.width - backgroundWidth) / 2)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const bgColor = 'rgba(0,0,0,0.6)'

  for (let i = lines.length - 1, row = 0; i >= 0; i--, row++) {
    const y = startY - row * (subtitleHeight + spacing)
    ctx.fillStyle = bgColor
    ctx.fillRect(startX, y, backgroundWidth, subtitleHeight)
    const cx = startX + backgroundWidth / 2
    const cy = y + subtitleHeight / 2 + (paddingY > 0 ? 0 : 0)
    ctx.lineWidth = 2
    ctx.strokeStyle = strokeColor
    ctx.fillStyle = fillColor
    ctx.strokeText(lines[i], cx, cy)
    ctx.fillText(lines[i], cx, cy)
  }
  showToast('字幕图片生成成功！')
}

function save() {
  if (!canvas) return
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  const base = originalName.replace(/\.[^.]+$/, '')
  a.download = `${base}-caption.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

fileInput.addEventListener('change', e => {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  const okType = /^image\/(png|jpg|jpeg|webp)$/i.test(f.type) || /\.(png|jpg|jpeg|webp)$/i.test(f.name)
  if (!okType) {
    showToast('文件类型不支持')
    return
  }
  if (f.size > 10 * 1024 * 1024) {
    showToast('文件大小超过 10MB')
    return
  }
  const img = new Image()
  img.onload = () => {
    image = img
    originalName = f.name || 'image'
    preview.innerHTML = ''
    const ctx = ensureCanvas(img.naturalWidth, img.naturalHeight)
    ctx.drawImage(img, 0, 0)
  }
  img.src = URL.createObjectURL(f)
})

generateBtn.addEventListener('click', generate)
saveBtn.addEventListener('click', save)
