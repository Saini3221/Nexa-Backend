// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const Service = require("./models/Service");
const Blog = require("./models/Blog");
const Page = require("./models/Page");

const app = express();

/* ================= DATABASE ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("Mongo Error ❌", err));

/* ================= MIDDLEWARE ================= */
app.set("trust proxy", 1); // Trust the first proxy (Render)

const allowedOrigins = [
  "http://localhost:5173",
  "https://nexainfotech.com",
  "http://localhost:5174"

];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= SESSION ================= */
app.use(session({
  name: "nexa.sid",
  secret: process.env.SESSION_SECRET,
  proxy: true, // Required for secure cookies behind a proxy (like Render)
  resave: false, // Don't force save if not modified
  saveUninitialized: false, // Don't create session until something stored
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    partitioned: process.env.NODE_ENV === "production", // Required for modern browsers blocking third-party cookies
    maxAge: 1000 * 60 * 60 * 24
  }
}));

/* ================= CLOUDINARY CONFIG ================= */
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

console.log("☁️ Cloudinary Configured");
app.locals.cloudinary = cloudinary;

/* ================= ROUTES ================= */
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/blogs", require("./routes/blogRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/gallery", require("./routes/galleryRoutes"));
app.use("/api/portfolio", require("./routes/portfolioRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/navbar", require("./routes/navbarRoutes"));
app.use("/api/heroes", require("./routes/heroRoutes"));
app.use("/api/pages", require("./routes/pageRoutes"));
app.use("/api/seo", require("./routes/seoRoutes"));

/* ================= SITEMAP ================= */
app.get("/sitemap.xml", async (req, res) => {
  const baseUrl = "https://nexainfotech.com";
  const staticPages = ["", "/about", "/blog", "/gallery", "/portfolio", "/contact"];

  try {
    const services = await Service.find({}, "slug updatedAt");
    const blogs = await Blog.find({}, "_id updatedAt");
    const customPages = await Page.find({ isActive: true }, "pageId updatedAt");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    staticPages.forEach((path) => {
      xml += `\n  <url><loc>${baseUrl}${path}</loc><changefreq>monthly</changefreq><priority>${path === "" ? "1.0" : "0.8"}</priority></url>`;
    });

    services.forEach((s) => {
      const url = s.slug.startsWith("/") ? s.slug : `/${s.slug}`;
      xml += `\n  <url><loc>${baseUrl}${url}</loc><lastmod>${s.updatedAt.toISOString().split("T")[0]}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
    });

    blogs.forEach((b) => {
      xml += `\n  <url><loc>${baseUrl}/blog/${b._id}</loc><lastmod>${b.updatedAt.toISOString().split("T")[0]}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    });

    customPages.forEach((p) => {
      const path = p.pageId.startsWith("/") ? p.pageId : `/${p.pageId}`;
      if (!staticPages.includes(path)) {
        xml += `\n  <url><loc>${baseUrl}${path}</loc><lastmod>${p.updatedAt.toISOString().split("T")[0]}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
      }
    });

    xml += `\n</urlset>`;
    res.set("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation error:", err);
    res.status(500).send("Error generating sitemap");
  }
});

app.get("/sitemap.xsl", (req, res) => {
  const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
		<html xmlns="http://www.w3.org/1999/xhtml">
		<head>
			<title>XML Sitemap | Nexa Infotech</title>
			<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
			<style type="text/css">
				body {
					font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
					font-size: 14px;
					color: #d1d5db;
					background-color: #0c0c16;
					margin: 0;
					padding: 40px;
				}
				a {
					color: #22d3ee;
					text-decoration: none;
				}
				a:hover {
					text-decoration: underline;
				}
				.header {
					background: #111827;
					padding: 30px;
					border-radius: 16px;
					border: 1px border #1f2937;
					margin-bottom: 30px;
					box-shadow: 0 10px 30px rgba(0,0,0,0.5);
				}
				h1 {
					margin: 0;
					color: #fff;
					font-size: 28px;
				}
				.cyan { color: #22d3ee; }
				p {
					margin: 10px 0 0;
					color: #9ca3af;
					line-height: 1.6;
				}
				table {
					width: 100%;
					border-collapse: collapse;
					background: #111827;
					border-radius: 16px;
					overflow: hidden;
					box-shadow: 0 10px 30px rgba(0,0,0,0.5);
					border: 1px solid #1f2937;
				}
				th {
					background: #1f2937;
					color: #22d3ee;
					text-align: left;
					padding: 15px 20px;
					font-weight: 700;
					text-transform: uppercase;
					font-size: 12px;
					letter-spacing: 1px;
				}
				td {
					padding: 15px 20px;
					border-bottom: 1px solid #1f2937;
				}
				tr:last-child td {
					border-bottom: none;
				}
				tr:hover td {
					background: rgba(34, 211, 238, 0.05);
				}
				.footer {
					margin-top: 30px;
					text-align: center;
					color: #4b5563;
					font-size: 12px;
				}
			</style>
		</head>
		<body>
			<div class="header">
				<h1>Nexa Infotech <span class="cyan">XML Sitemap</span></h1>
				<p>This is a dynamic sitemap generated for Search Engines like Google and Bing. <br/>
				It automatically updates whenever you add new services or blogs in your dashboard.</p>
			</div>
			<div id="content">
				<table>
					<tr>
						<th width="75%">URL</th>
						<th width="10%">Priority</th>
						<th width="15%">Last Modified</th>
					</tr>
					<xsl:for-each select="sitemap:urlset/sitemap:url">
						<tr>
							<td>
								<xsl:variable name="itemURL">
									<xsl:value-of select="sitemap:loc"/>
								</xsl:variable>
								<a href="{$itemURL}">
									<xsl:value-of select="sitemap:loc"/>
								</a>
							</td>
							<td>
								<xsl:value-of select="sitemap:priority"/>
							</td>
							<td>
								<xsl:value-of select="sitemap:lastmod"/>
							</td>
						</tr>
					</xsl:for-each>
				</table>
			</div>
			<div class="footer">
				Generated by Nexa Infotech AI SEO Engine
			</div>
		</body>
		</html>
	</xsl:template>
</xsl:stylesheet>`;
  
  res.set("Content-Type", "application/xml");
  res.status(200).send(xsl);
});

/* ================= HOME ROUTE ================= */
app.get("/", (req, res) => {
  res.send("🚀 Nexa Backend API Running Successfully");
});

/* ================= ERROR HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route Not Found ❌" });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Resend Email: ${process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Not configured'}`);

});