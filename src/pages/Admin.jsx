import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const ADMIN_EMAIL = "kshreya4207@gmail.com";

export default function Admin() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [links, setLinks] = useState([]);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to load
    if (currentUser === undefined) return;

    // Not logged in
    if (currentUser === null) {
      setLoading(false);
      return;
    }

    // Wrong email
    if (currentUser.email !== ADMIN_EMAIL) {
      setLoading(false);
      return;
    }

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubLinks = onSnapshot(collection(db, "trackingLinks"), (snap) => {
      setLinks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubUsers();
      unsubLinks();
    };
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-primary font-display text-2xl">Loading...</div>
      </div>
    );
  }

  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-accent font-display text-2xl">Access Denied</div>
      </div>
    );
  }

  const totalCaptures = links.reduce((a, l) => a + (l.captures?.length || 0), 0);
  const totalClicks = links.reduce((a, l) => a + (l.clicks || 0), 0);

  return (
    <div className="min-h-screen bg-surface pt-16 text-text-primary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="font-display text-4xl tracking-wider mb-2">
          ADMIN <span className="text-primary">PANEL</span>
        </h1>
        <p className="font-body text-sm text-text-muted mb-8">
          Logged in as <span className="text-primary">{currentUser?.email}</span>
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: users.length },
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
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg font-body text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-primary text-surface"
                  : "bg-surface-card border border-surface-border text-text-secondary hover:border-primary"
              }`}
            >
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
                    {["Name", "Email", "Badge ID", "Department", "Credits", "Links Generated", "Joined"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-body text-xs text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-surface-border hover:bg-surface-card transition-colors">
                      <td className="px-4 py-3 font-body text-sm text-text-primary whitespace-nowrap">{user.displayName || "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{user.email || "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{user.badgeId || "-"}</td>
                      <td className="px-4 py-3 font-body text-sm text-text-secondary whitespace-nowrap">{user.department || "-"}</td>
                      <td className="px-4 py-3 font-mono text-sm text-primary text-center">{user.credits ?? 0}</td>
                      <td className="px-4 py-3 font-mono text-sm text-text-secondary text-center">{user.totalLinksGenerated ?? 0}</td>
                      <td className="px-4 py-3 font-body text-xs text-text-muted whitespace-nowrap">
                        {user.createdAt ? new Date(user.createdAt.toMillis()).toLocaleDateString("en-IN") : "-"}
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
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-semibold text-text-primary">{link.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${link.active ? "bg-primary/10 text-primary" : "bg-text-muted/10 text-text-muted"}`}>
                        {link.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
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
                              {capture.screenWidth && (
                                <DataRow label="Screen" value={capture.screenWidth + "x" + capture.screenHeight} />
                              )}
                            </div>
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