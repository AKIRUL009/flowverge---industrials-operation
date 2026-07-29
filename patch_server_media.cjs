const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const mediaRoute = `
app.get('/api/media', authenticate, (req, res) => {
  const media = db.prepare(\`
    SELECT
      ca.id as answer_id,
      ca.answer_value as photo_data,
      ca.photo_metadata,
      ca.remarks,
      ci.question_text,
      cr.submitted_at as date,
      s.id as site_id,
      s.name as site_name,
      st.id as stage_id,
      st.name as stage_name,
      u.full_name as uploader_name
    FROM checklist_answers ca
    JOIN checklist_items ci ON ca.item_id = ci.id
    JOIN checklist_responses cr ON ca.response_id = cr.id
    JOIN checklist_templates ct ON cr.template_id = ct.id
    JOIN sites s ON cr.site_id = s.id
    JOIN stages st ON ct.stage_id = st.id
    JOIN users u ON cr.filled_by = u.id
    WHERE ci.answer_type = 'Photo' OR ca.answer_value LIKE 'data:image%'
    ORDER BY cr.submitted_at DESC
  \`).all();
  res.json(media);
});
`;

if (code.includes('/api/media')) {
  console.log('Already has /api/media');
} else {
  code = code.replace("// --- CHECKLIST ROUTES ---", "// --- CHECKLIST ROUTES ---\n" + mediaRoute);
  fs.writeFileSync('server.ts', code);
  console.log('Patched server.ts with /api/media');
}
