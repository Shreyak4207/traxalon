import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { createTrackingLink } from "../utils/linkService";
import {
  Link2, Zap, Copy, Shield, Activity,
  ChevronRight, AlertCircle, Clock, Smartphone,
  Globe, Eye, CreditCard, X
} from "lucide-react";

export default function Dashboard() {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const [links, setLinks] = useState([]);
  const [label, setLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [credits, setCredits] = useState(userProfile?.credits ?? 0);
  const [selectedLink, setSelectedLink] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
      if (snap.exists()) setCredits(snap.data().credits ?? 0);
    });
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "trackingLinks"),
      where("uid", "==", currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      );
      setLinks(data);
    });
    return unsub;
  }, [currentUser]);

  async function handleGenerate(e) {
    e.preventDefault();
    if (credits < 1) {
      setShowPayment(true);
      return;
    }
    setGenerating(true);
    setError("");
    setSuccess("");
    try {
      const { trackingUrl } = await createTrackingLink(
        currentUser.uid,
        label || "Tracking Link"
      );
      setSuccess(trackingUrl);
      setLabel("");
      await fetchUserProfile(currentUser.uid);
    } catch (err) {
      setError(err.message);
    }
    setGenerating(false);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="min-h-screen bg-surface pt-16 text-text-primary">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl tracking-wider">
              COMMAND <span className="text-primary">CENTER</span>
            </h1>
            <p className="font-body text-sm text-text-secondary mt-1">
              Welcome back,{" "}
              <span className="text-primary">
                {userProfile?.displayName || "Officer"}
              </span>
              {userProfile?.badgeId && (
                <span className="text-text-muted">
                  {" "}· Badge #{userProfile.badgeId}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-surface-card border border-surface-border rounded-xl px-5 py-3 flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <div className="font-mono text-2xl text-primary leading-none">
                  {credits}
                </div>
                <div className="font-body text-xs text-text-muted">Credits</div>
              </div>
            </div>
            <button
              onClick={() => setShowPayment(true)}
              className="px-4 py-3 bg-primary/10 border border-primary/30 text-primary rounded-xl font-body text-sm hover:bg-primary/20 transition-colors flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Buy Credits
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Links", value: links.length, icon: <Link2 className="w-4 h-4" /> },
            { label: "Total Captures", value: links.reduce((a, l) => a + (l.captures?.length || 0), 0), icon: <Eye className="w-4 h-4" /> },
            { label: "Active Links", value: links.filter((l) => l.active).length, icon: <Activity className="w-4 h-4" /> },
            { label: "Total Clicks", value: links.reduce((a, l) => a + (l.clicks || 0), 0), icon: <Globe className="w-4 h-4" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-card border border-surface-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-text-muted mb-2">
                {stat.icon}
                <span className="font-body text-xs uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <div className="font-display text-3xl text-text-primary">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          <div className="lg:col-span-1">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
              <h2 className="font-display text-xl tracking-wider mb-1">
                GENERATE <span className="text-primary">LINK</span>
              </h2>
              <p className="font-body text-xs text-text-muted mb-6">
                Creates a disguised GPay-looking link that captures device data
              </p>

              {error && (
                <div className="flex items-start gap-2 bg-accent/10 border border-accent/30 text-accent rounded-lg px-3 py-2.5 font-body text-sm mb-4">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4">
                  <p className="font-body text-xs text-primary mb-2 font-semibold">
                    Link Generated!
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-secondary truncate flex-1">
                      {success}
                    </span>
                    <button
                      onClick={() => copyToClipboard(success)}
                      className="text-primary hover:text-primary-dark flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">
                    Case / Label (optional)
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g., Case #2024-078"
                    className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full px-4 py-3 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  {generating
                    ? "Generating..."
                    : credits > 0
                    ? "Generate Link (1 credit)"
                    : "No Credits - Buy Now"}
                </button>
              </form>

              <div className="mt-4 p-3 bg-surface border border-surface-border rounded-lg">
                <p className="font-body text-xs text-text-muted">
                  <span className="text-primary font-semibold">How it works: </span>
                  The link appears as a Google Pay lucky draw page. When opened,
                  it silently captures IP, location, device info and browser
                  fingerprint.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
              <h2 className="font-display text-xl tracking-wider mb-6">
                TRACKING <span className="text-primary">LINKS</span>
              </h2>

              {links.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="font-body text-text-muted">
                    No links generated yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="bg-surface border border-surface-border rounded-xl p-4 hover:border-primary/40 transition-all cursor-pointer"
                      onClick={() =>
                        setSelectedLink(
                          selectedLink?.id === link.id ? null : link
                        )
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-body text-sm font-semibold text-text-primary truncate">
                              {link.label}
                            </span>
                          </div>
                          <div className="font-mono text-xs text-text-muted truncate">
                            {link.trackingUrl}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(link.trackingUrl);
                            }}
                            className="p-1.5 text-text-muted hover:text-primary transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <ChevronRight
                            className={`w-4 h-4 text-text-muted transition-transform ${
                              selectedLink?.id === link.id ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-text-muted font-body">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {link.clicks || 0} clicks
                        </span>
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          {link.captures?.length || 0} captures
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {link.createdAt
                            ? new Date(link.createdAt.toMillis()).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>

                      {selectedLink?.id === link.id && link.captures?.length > 0 && (
                        <div className="mt-4 border-t border-surface-border pt-4">
                          <h4 className="font-body text-xs text-text-secondary uppercase tracking-wider mb-3">
                            Captured Device Data
                          </h4>
                          {link.captures.map((capture, i) => (
                            <div
                              key={i}
                              className="bg-surface-elevated border border-surface-border rounded-lg p-4 mb-3"
                            >
                              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                {capture.ip && (
                                  <DataRow label="IP Address" value={capture.ip} />
                                )}
                                {capture.city && (
                                  <DataRow label="Location" value={capture.city + ", " + capture.country} />
                                )}
                                {capture.device && (
                                  <DataRow label="Device" value={capture.device} />
                                )}
                                {capture.browser && (
                                  <DataRow label="Browser" value={capture.browser} />
                                )}
                                {capture.os && (
                                  <DataRow label="OS" value={capture.os} />
                                )}
                                {capture.isp && (
                                  <DataRow label="ISP" value={capture.isp} />
                                )}
                                {capture.timezone && (
                                  <DataRow label="Timezone" value={capture.timezone} />
                                )}
                                {capture.screenWidth && (
                                  <DataRow label="Screen" value={capture.screenWidth + "x" + capture.screenHeight} />
                                )}
                              </div>

                              {/* {capture.lat && (
                                <div className="mt-3 pt-3 border-t border-surface-border">
                                  <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-2">GPS Location</div>
                                  {capture.address && (
                                    <div className="font-mono text-xs text-text-secondary mb-2">{capture.address}</div>
                                  )}
                                  
                                  <a href={"https://www.google.com/maps?q=" + capture.lat + "," + capture.lon}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={function(e) { e.stopPropagation(); }}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors"
                                  >
                                    📍 View Location on Maps
                                  </a>
                                </div>
                              )} */}

                              {capture.lat && (
  <div className="mt-3 pt-3 border-t border-surface-border">
    <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-2">GPS Location</div>
    {capture.address && (
      <div className="font-mono text-xs text-text-secondary mb-2">{capture.address}</div>
    )}
    {/* Map Box */}
    <div className="rounded-xl overflow-hidden border border-surface-border mb-3" style={{ height: 180 }}>
      <iframe
        title="location"
        width="100%"
        height="100%"
        frameBorder="0"
        src={"https://maps.google.com/maps?q=" + capture.lat + "," + capture.lon + "&z=15&output=embed"}
        allowFullScreen
      />
    </div>
    {/* View on Maps Button */}
    
      <a href={"https://www.google.com/maps?q=" + capture.lat + "," + capture.lon}
      target="_blank"
      rel="noreferrer"
      onClick={function(e) { e.stopPropagation(); }}
      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-surface rounded-lg font-body text-xs font-bold hover:bg-primary-dark transition-colors"
    >
      📍 View on Google Maps
    </a>
  </div>
)}

                              <div className="font-mono text-xs text-text-muted mt-3">
                                {capture.capturedAt}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedLink?.id === link.id && (!link.captures || link.captures.length === 0) && (
                        <div className="mt-4 border-t border-surface-border pt-4">
                          <p className="font-body text-xs text-text-muted text-center">
                            No captures yet. Link clicked {link.clicks || 0} time(s).
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          uid={currentUser?.uid}
          fetchUserProfile={fetchUserProfile}
        />
      )}
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div>
      <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="font-mono text-xs text-text-primary break-all">{value}</div>
    </div>
  );
}

function PaymentModal({ onClose, uid, fetchUserProfile }) {
  const plans = [
    { credits: 5, price: 99, label: "Starter Pack" },
    { credits: 15, price: 249, label: "Investigation Pack", popular: true },
    { credits: 50, price: 699, label: "Department Pack" },
  ];
  const [selected, setSelected] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  async function handlePurchase() {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    const { addCredits } = await import("../utils/linkService");
    await addCredits(uid, plans[selected].credits);
    await fetchUserProfile(uid);
    setDone(true);
    setProcessing(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 w-full max-w-md shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl tracking-wider text-text-primary">
            BUY <span className="text-primary">CREDITS</span>
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-display text-2xl text-primary mb-2">Credits Added!</h3>
            <p className="font-body text-text-secondary text-sm">
              {plans[selected].credits} credits added to your account.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-3 bg-primary text-surface font-body font-bold rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {plans.map((plan, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected === i
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-surface-border bg-surface hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg text-text-primary">{plan.label}</span>
                        {plan.popular && (
                          <span className="bg-primary text-surface text-xs px-2 py-0.5 rounded-full font-body font-bold">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <div className="font-body text-sm text-text-secondary mt-0.5">
                        {plan.credits} tracking links
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl text-primary">Rs.{plan.price}</div>
                      <div className="font-body text-xs text-text-muted">
                        Rs.{(plan.price / plan.credits).toFixed(0)}/link
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-surface border border-surface-border rounded-xl p-3 mb-4 text-xs font-body text-text-muted">
              Demo Mode: Integrate Razorpay for real payments in production.
            </div>

            <button
              onClick={handlePurchase}
              disabled={processing}
              className="w-full px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {processing ? "Processing..." : "Pay Rs." + plans[selected].price}
            </button>
          </>
        )}
      </div>
    </div>
  );
}