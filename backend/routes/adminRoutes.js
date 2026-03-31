const express = require("express");
const router = express.Router();

/* LOGIN */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  // Hardcoded credentials - ideally should be from database
  if (email === "admin@gmail.com" && password === "123456") {
    req.session.admin = {
      email,
      loginTime: new Date().toISOString()
    };

    return res.json({
      message: "Login Successful",
      admin: { email } // Don't send sensitive data
    });
  }

  res.status(401).json({ message: "Invalid Credentials" });
});

/* CHECK AUTH (Hardened) */
router.get("/check-auth", (req, res) => {
  if (req.session?.admin && req.session.admin.email === "admin@gmail.com") {
    return res.json({
      authenticated: true,
      admin: { email: req.session.admin.email }
    });
  }
  
  // Clear potential invalid bits
  if (req.session) {
    req.session.admin = null;
  }
  
  res.status(401).json({ authenticated: false, message: "Unauthorized admin access" });
});

/* LOGOUT */
router.post("/logout", (req, res) => {
  if (!req.session?.admin) {
    return res.status(400).json({ message: "No active session" });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie("nexa.sid", {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });

    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;