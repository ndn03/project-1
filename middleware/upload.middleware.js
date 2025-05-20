const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Lấy folder từ req.body hoặc mặc định là 'img'
    let folder = req.body.folder || 'img';
    // Đảm bảo chỉ cho phép các folder hợp lệ
    const allowedFolders = ['img', 'img/DonghoNam', 'img/DonghoVip', 'img/DonghoNu'];
    if (!allowedFolders.includes(folder)) folder = 'img';
    cb(null, 'public/' + folder);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif)'));
  }
});

module.exports = upload;