const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

// Create a file to stream archive data to
const output = fs.createWriteStream('ideainovo-drdo-portal.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log(`Archive created successfully: ${archive.pointer()} total bytes`);
  console.log('Archive has been finalized and the output file descriptor has closed.');
});

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

// Good practice to catch this error explicitly
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files and directories, excluding specified patterns
const excludePatterns = [
  'node_modules',
  '.git',
  'dist',
  '*.log',
  'ideainovo-drdo-portal.zip' // Don't include the zip file itself
];

function shouldExclude(filePath) {
  return excludePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function addDirectory(dirPath, zipPath = '') {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const zipItemPath = zipPath ? path.join(zipPath, item) : item;
    
    if (shouldExclude(fullPath)) {
      console.log(`Excluding: ${fullPath}`);
      return;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      addDirectory(fullPath, zipItemPath);
    } else {
      console.log(`Adding: ${fullPath}`);
      archive.file(fullPath, { name: zipItemPath });
    }
  });
}

// Add all files from current directory
addDirectory('.');

// Finalize the archive
archive.finalize();