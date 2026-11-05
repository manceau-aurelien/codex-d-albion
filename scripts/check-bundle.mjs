import fs from 'node:fs';

const html = fs.readFileSync('Le_Codex_d_Albion.html', 'utf8');
const start = html.indexOf('<script type="module">') + '<script type="module">'.length;
const end = html.lastIndexOf('</script>');
const js = html.slice(start, end);

console.log('Extracted JS length:', js.length);
// Check if there are any other </script> inside
console.log('Contains </script> inside?:', /<\/script/i.test(js));
