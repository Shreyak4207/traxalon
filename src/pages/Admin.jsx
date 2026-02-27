import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const ADMIN_PASSWORD = "traxelon@admin123";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [links, setLinks] = useState([]);
  const [tab, setTab] = useState("users");
  const [refreshing, setRefreshing] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  async function fetchData() {
    setRefreshing(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      usersData.sort((a, b) => (b.lastSeen?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0) - (a.lastSeen?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0));
      setUsers(usersData);

      const linksSnap = await getDocs(collection(db, "trackingLinks"));
      const linksData = linksSnap.docs.map((d) => {
        const data = { id: d.id, ...d.data() };
        if (data.captures?.length > 0) {
          data.captures.sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
        }
        return data;
      });
      linksData.sort((a, b) => {
        const aTime = a.captures?.[0]?.capturedAt ? new Date(a.captures[0].capturedAt) : (a.createdAt?.toMillis?.() ?? 0);
        const bTime = b.captures?.[0]?.capturedAt ? new Date(b.captures[0].capturedAt) : (b.createdAt?.toMillis?.() ?? 0);
        return bTime - aTime;
      });
      setLinks(linksData);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
    setRefreshing(false);
  }

  useEffect(() => {
    if (!unlocked) return;
    fetchData();
    const interval = setInterval(() => { fetchData(); }, 30 * 1000);
    return () => clearInterval(interval);
  }, [unlocked]);

  function handleUnlock() {
    if (password === ADMIN_PASSWORD) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Wrong password!");
    }
  }

  function isActive(user) {
    if (!user.lastSeen) return false;
    return (new Date() - new Date(user.lastSeen.toMillis())) < 5 * 60 * 1000;
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      alert("Error deleting user!");
    }
  }

  async function handleUpdateCredits(userId, newCredits) {
    try {
      await updateDoc(doc(db, "users", userId), { credits: newCredits });
      setUsers(users.map((u) => u.id === userId ? { ...u, credits: newCredits } : u));
    } catch (err) {
      alert("Error updating credits!");
    }
  }

  async function handleSaveEdit() {
    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        displayName: editForm.displayName,
        email: editForm.email,
        badgeId: editForm.badgeId,
        department: editForm.department,
      });
      setUsers(users.map((u) => u.id === editingUser.id ? { ...u, ...editForm } : u));
      setEditingUser(null);
    } catch (err) {
      alert("Error updating user!");
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-8 w-full max-w-sm">
          <h1 className="font-display text-3xl tracking-wider mb-2 text-text-primary">
            ADMIN <span className="text-primary">ACCESS</span>
          </h1>
          <p className="font-body text-sm text-text-muted mb-6">Enter admin password to continue</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Enter password"
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors mb-3"
          />
          {error && <p className="font-body text-xs text-accent mb-3">{error}</p>}
          <button onClick={handleUnlock} className="w-full px-4 py-3 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all">
            Unlock Admin Panel
          </button>
        </div>
      </div>
    );
  }

  const totalCaptures = links.reduce((a, l) => a + (l.captures?.length || 0), 0);
  const totalClicks = links.reduce((a, l) => a + (l.clicks || 0), 0);
  const activeUsers = users.filter(isActive).length;

  return (
    <div className="min-h-screen bg-surface pt-16 text-text-primary">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 w-full max-w-md">
              <h2 className="font-display text-2xl text-text-primary mb-4">EDIT USER</h2>
              {["displayName", "email", "badgeId", "department"].map((field) => (
                <div key={field} className="mb-3">
                  <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1 block">{field}</label>
                  <input
                    value={editForm[field] || ""}
                    onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 font-body text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
              <div className="flex gap-3 mt-4">
                <button onClick={handleSaveEdit} className="flex-1 px-4 py-2 bg-primary text-surface font-body font-bold rounded-lg">Save</button>
                <button onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2 bg-surface-card border border-surface-border text-text-secondary font-body rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-4xl tracking-wider">
            ADMIN <span className="text-primary">PANEL</span>
          </h1>
          <button onClick={fetchData} disabled={refreshing} className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg font-body text-sm hover:bg-primary/20 transition-colors disabled:opacity-50">
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
        <p className="font-body text-sm text-text-muted mb-8">Full system overview</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Users", value: users.length },
            { label: "Active Now", value: activeUsers },
            { label: "Total Links", value: links.length },
            { label: "Total Captures", value: totalCaptures },
            { label: "Total Clicks", value: totalClicks },
          ].map((s) => (
            <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl p-4">
              <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-1">{s.label}</div>
              <div className="font-display text-3xl text-primary">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          {["users", "links"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg font-body text-sm font-semibold transition-all ${tab === t ? "bg-primary text-surface" : "bg-surface-card border border-surface-border text-text-secondary hover:border-primary"}`}>
              {t === "users" ? `All Users (${users.length})` : `All Links (${links.length})`}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <div className="bg-surface-elevated border border-surface-border rounded-2xl overflow-x-auto">
            {users.length === 0 ? (
              <div className="text-center py-12 font-body text-text-muted">No users found</div>
            ) : (
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-surface-border">
                    {["Status", "Name", "Email", "Badge ID", "Department", "Credits", "Links", "Last Seen", "Joined", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-body text-xs text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-surface-border hover:bg-surface-card transition-colors">
                      <td className="px-4 py-3">
                        {isActive(user) ? (
                          <span className="px-2 py-1 rounded-full text-xs font-mono bg-green-500/10 text-green-400 whitespace-nowrap">● ACTIVE</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-mono bg-text-muted/10 text-text-muted whitespace-nowrap">○ OFFLINE</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-text-primary whitespace-nowrap">{user.displayName || "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{user.email || "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{user.badgeId || "-"}</td>
                      <td className="px-4 py-3 font-body text-sm text-text-secondary whitespace-nowrap">{user.department || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleUpdateCredits(user.id, (user.credits ?? 0) - 1)}
                            className="w-6 h-6 bg-surface border border-surface-border rounded text-text-secondary hover:border-primary hover:text-primary text-xs">−</button>
                          <span className="font-mono text-sm text-primary w-6 text-center">{user.credits ?? 0}</span>
                          <button onClick={() => handleUpdateCredits(user.id, (user.credits ?? 0) + 1)}
                            className="w-6 h-6 bg-surface border border-surface-border rounded text-text-secondary hover:border-primary hover:text-primary text-xs">+</button>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-text-secondary text-center">{user.totalLinksGenerated ?? 0}</td>
                      <td className="px-4 py-3 font-body text-xs text-text-muted whitespace-nowrap">
                        {user.lastSeen ? new Date(user.lastSeen.toMillis()).toLocaleString("en-IN") : "Never"}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-text-muted whitespace-nowrap">
                        {user.createdAt ? new Date(user.createdAt.toMillis()).toLocaleDateString("en-IN") : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingUser(user); setEditForm({ displayName: user.displayName, email: user.email, badgeId: user.badgeId, department: user.department }); }}
                            className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg font-body text-xs hover:bg-red-500/20 transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "links" && (
          <div className="space-y-4">
            {links.length === 0 ? (
              <div className="text-center py-12 font-body text-text-muted">No links found</div>
            ) : (
              links.map((link) => (
                <div key={link.id} className="bg-surface-elevated border border-surface-border rounded-xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="font-body text-sm font-semibold text-text-primary">{link.label}</div>
                    <div className="font-body text-xs text-text-muted">
                      {link.clicks || 0} clicks · {link.captures?.length || 0} captures
                    </div>
                  </div>
                  <div className="font-mono text-xs text-text-muted mb-1 break-all">{link.trackingUrl}</div>
                  <div className="font-body text-xs text-text-muted mb-3">
                    Created: {link.createdAt ? new Date(link.createdAt.toMillis()).toLocaleString("en-IN") : "-"}
                  </div>
                  {link.captures?.length > 0 && (
                    <div className="border-t border-surface-border pt-3 mt-3">
                      <div className="font-body text-xs text-text-secondary uppercase tracking-wider mb-3">
                        Captured Data ({link.captures.length})
                      </div>
                      <div className="space-y-2">
                        {link.captures.map((capture, i) => (
                          <div key={i} className="bg-surface border border-surface-border rounded-lg p-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {capture.ip && <DataRow label="IP" value={capture.ip} />}
                              {capture.city && <DataRow label="Location" value={capture.city + ", " + capture.country} />}
                              {capture.device && <DataRow label="Device" value={capture.device} />}
                              {capture.browser && <DataRow label="Browser" value={capture.browser} />}
                              {capture.os && <DataRow label="OS" value={capture.os} />}
                              {capture.isp && <DataRow label="ISP" value={capture.isp} />}
                              {capture.timezone && <DataRow label="Timezone" value={capture.timezone} />}
                              {capture.screenWidth && <DataRow label="Screen" value={capture.screenWidth + "x" + capture.screenHeight} />}
                            </div>

                            {capture.lat && (
                              <div className="mt-3 pt-3 border-t border-surface-border">
                                <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-2">GPS Location</div>
                                {capture.address && (
                                  <div className="font-mono text-xs text-text-secondary mb-2">{capture.address}</div>
                                )}
                                <div className="rounded-xl overflow-hidden border border-surface-border mb-3" style={{ height: 180 }}>
                                  <iframe
                                    title={"map-" + i}
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    src={"https://maps.google.com/maps?q=" + capture.lat + "," + capture.lon + "&z=15&output=embed"}
                                    allowFullScreen
                                  />
                                </div>
                                
                                  <a href={"https://www.google.com/maps?q=" + capture.lat + "," + capture.lon}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-surface rounded-lg font-body text-xs font-bold hover:bg-primary-dark transition-colors"
                                >
                                  📍 View on Google Maps
                                </a>
                              </div>
                            )}

                            <div className="font-mono text-xs text-text-muted mt-2">{capture.capturedAt}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div>
      <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-0.5">{label}</div>
      <div className="font-mono text-xs text-text-primary break-all">{value}</div>
    </div>
  );
}