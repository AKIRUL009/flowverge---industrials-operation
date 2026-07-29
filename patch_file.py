import sys

filename = 'src/components/SiteDetail.tsx'
with open(filename, 'r') as f:
    content = f.read()

target = """                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${
                                    resp.answer_value === 'Yes' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    resp.answer_value === 'No' ? 'bg-red-50 text-red-600 border-red-100' :
                                    'bg-zinc-50 text-zinc-600 border-zinc-100'
                                  }`}>
                                    {resp.answer_value}
                                  </span>
                                </div>
                                {resp.remarks && (
                                  <p className="text-sm text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-100 italic">
                                    "{resp.remarks}"
                                  </p>
                                )}
                                {resp.photo_url && (
                                  <div className="w-32 aspect-square rounded-xl overflow-hidden border border-zinc-200">
                                    <img src={resp.photo_url} alt="Proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                )}
                              </div>"""

replacement = """                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${
                                    resp.answer_value === 'Yes' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    resp.answer_value === 'No' ? 'bg-red-50 text-red-600 border-red-100' :
                                    'bg-zinc-50 text-zinc-600 border-zinc-100'
                                  }`}>
                                    {resp.answer_value?.startsWith('data:image') ? 'Photo Uploaded' : resp.answer_value}
                                  </span>
                                </div>
                                {resp.remarks && (
                                  <p className="text-sm text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-100 italic">
                                    "{resp.remarks}"
                                  </p>
                                )}
                                {(resp.photo_url || (resp.answer_value && resp.answer_value.startsWith('data:image'))) && (
                                  <div className="mt-2 space-y-2">
                                    <div className="w-32 aspect-square rounded-xl overflow-hidden border border-zinc-200">
                                      <img src={resp.photo_url || resp.answer_value} alt="Proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    {resp.photo_metadata && (
                                      <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-2 text-xs font-mono text-zinc-600 space-y-1">
                                        {(() => {
                                          try {
                                            const meta = typeof resp.photo_metadata === 'string' ? JSON.parse(resp.photo_metadata) : resp.photo_metadata;
                                            return (
                                              <>
                                                <div>📍 {meta.latitude?.toFixed(5) || 'N/A'}°, {meta.longitude?.toFixed(5) || 'N/A'}°</div>
                                                <div>🕒 {new Date(meta.timestamp).toLocaleString()}</div>
                                                {meta.compassHeading && <div>🧭 {meta.compassHeading}° {meta.compassDirection}</div>}
                                                {meta.accuracy && <div>± {Math.round(meta.accuracy)}m</div>}
                                              </>
                                            );
                                          } catch (e) {
                                            return <div>Invalid metadata</div>;
                                          }
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>"""

if target in content:
    content = content.replace(target, replacement)
    with open(filename, 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Target not found")
