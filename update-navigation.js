const fs = require('fs');
const path = require('path');

const files = [
  'views/about-us.html',
  'views/blog.html',
  'views/blog-post.html',
  'views/contact.html',
  'views/edmunds-mastermind.html',
  'views/mastermind-registered.html',
  'views/partner-program.html',
  'views/privacy.html',
  'views/video-archive.html',
  'views/services/communication-customer-interaction.html',
  'views/services/industry-specific-premium.html',
  'views/services/marketing-content.html',
  'views/services/operations-workflow.html',
  'views/services/sales-revenue-generation.html'
];

const oldNav = `        <ul class="nav-menu">
          <li><a href="/" class="nav-link active">Home</a></li>
          <li><a href="/about-us" class="nav-link">About Us</a></li>
          <li><a href="#services" class="nav-link">Services</a></li>
          <li><a href="/partner-program" class="nav-link">Partnership</a></li>
          <li><a href="/edmunds-mastermind" class="nav-link">Edmund's Mastermind</a></li>
          <li><a href="/blog" class="nav-link">Blog</a></li>
          <li><a href="/video-archive" class="nav-link">Video</a></li>
          <li><a href="/contact" class="btn btn-primary btn-sm">Get Started</a></li>
        </ul>`;

const newNav = `        <ul class="nav-menu">
          <li><a href="/" class="nav-link active">Home</a></li>
          <li class="nav-dropdown">
            <a href="/about-us" class="nav-link">About ▾</a>
            <ul class="dropdown-menu">
              <li><a href="/about-us#edmund">About Edmund Bogen</a></li>
              <li><a href="/about-us#eytan">About Eytan Benzeno</a></li>
            </ul>
          </li>
          <li class="nav-dropdown">
            <a href="#services" class="nav-link">Services ▾</a>
            <ul class="dropdown-menu">
              <li><a href="/services/communication-customer-interaction">Communication & Customer Interaction</a></li>
              <li><a href="/services/sales-revenue-generation">Sales & Revenue Generation</a></li>
              <li><a href="/services/operations-workflow">Operations & Workflow</a></li>
              <li><a href="/services/marketing-content">Marketing & Content</a></li>
              <li><a href="/services/industry-specific-premium">Industry-Specific Premium</a></li>
            </ul>
          </li>
          <li><a href="/partner-program" class="nav-link">Partnership</a></li>
          <li><a href="/edmunds-mastermind" class="nav-link">Edmund's Mastermind</a></li>
          <li><a href="/blog" class="nav-link">Blog</a></li>
          <li><a href="/video-archive" class="nav-link">Video</a></li>
          <li><a href="/contact" class="btn btn-primary btn-sm">Get Started</a></li>
        </ul>`;

let updatedCount = 0;
let skippedCount = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    skippedCount++;
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(oldNav)) {
    content = content.replace(oldNav, newNav);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${file}`);
    updatedCount++;
  } else if (content.includes('nav-dropdown')) {
    console.log(`ℹ️  Already updated: ${file}`);
    skippedCount++;
  } else {
    console.log(`⚠️  Navigation not found in expected format: ${file}`);
    skippedCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Updated: ${updatedCount} files`);
console.log(`   Skipped: ${skippedCount} files`);
