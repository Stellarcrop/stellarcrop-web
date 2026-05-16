import { useEffect, useMemo, useState } from "react";
import {
  getAddress,
  isAllowed,
  isConnected,
  setAllowed,
  signTransaction,
} from "@stellar/freighter-api";
import {
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Coins,
  Copy,
  FilePlus2,
  GitBranch,
  Home,
  Landmark,
  Layers3,
  LayoutDashboard,
  MapPinned,
  Moon,
  PackageCheck,
  RefreshCw,
  ScanLine,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sprout,
  Sun,
  TrendingUp,
  Wallet,
  Warehouse,
} from "lucide-react";
import { stellarConfig, toDateTime, type Receipt } from "@stellarcrop/stellar";

const contractId = import.meta.env.NEXT_PUBLIC_RECEIPT_CONTRACT_ID ?? "not-configured";

const demoReceipts: Receipt[] = [
  {
    receipt_id: 1,
    issuer: "GCERTIFIEDSTORE123",
    owner: "GFARMERALICE123",
    commodity: "maize",
    quantity_kg: "50",
    grade: "A",
    warehouse_name: "AgriStore Ibadan",
    location: "Ibadan, NG",
    metadata_hash: "QmXyZ123",
    issued_at: 1765939200,
    expires_at: 1768617600,
    status: "Active",
  },
  {
    receipt_id: 2,
    issuer: "GCOOPKANO456",
    owner: "GFARMERKANO456",
    commodity: "rice",
    quantity_kg: "125",
    grade: "B+",
    warehouse_name: "Kano Grain Union",
    location: "Kano, NG",
    metadata_hash: "bafyRiceLot22",
    issued_at: 1765852800,
    expires_at: 1769049600,
    status: "Active",
  },
  {
    receipt_id: 3,
    issuer: "GAGRIHOCHI789",
    owner: "GTRADERDELTA789",
    commodity: "cassava",
    quantity_kg: "200",
    grade: "Industrial",
    warehouse_name: "Delta Produce Vault",
    location: "Asaba, NG",
    metadata_hash: "bafyCassava9",
    issued_at: 1765584000,
    expires_at: 1768176000,
    status: "Redeemed",
  },
];

const activity = [
  { label: "Receipt #2 issued", detail: "Kano Grain Union -> GFARMERKANO456", time: "08:41" },
  { label: "Receipt #1 transfer prepared", detail: "Maize A, 50kg", time: "09:10" },
  { label: "Issuer check passed", detail: "AgriStore Ibadan certified", time: "09:22" },
  { label: "Redemption queued", detail: "Cassava, Delta Produce Vault", time: "10:05" },
];

const corridors = [
  { market: "Ibadan", crop: "Maize", volume: "1.8t", change: "+12%" },
  { market: "Kano", crop: "Rice", volume: "3.2t", change: "+7%" },
  { market: "Ho Chi Minh", crop: "Coffee", volume: "920kg", change: "+4%" },
];

interface DraftIssue {
  owner: string;
  commodity: string;
  quantityKg: string;
  grade: string;
  warehouse: string;
  location: string;
  metadataHash: string;
  expiresAt: string;
}

const defaultIssue: DraftIssue = {
  owner: "",
  commodity: "maize",
  quantityKg: "50",
  grade: "A",
  warehouse: "AgriStore Ibadan",
  location: "Ibadan, NG",
  metadataHash: "",
  expiresAt: "",
};

type Theme = "light" | "dark";
type Mode = "issue" | "transfer" | "redeem";
type AppPage = "dashboard" | "receipts" | "transfers" | "markets" | "settings";

const shortAddress = (address: string) =>
  address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-5)}` : address;

export function App() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [status, setStatus] = useState<string>("Testnet workspace ready.");
  const [receipts, setReceipts] = useState<Receipt[]>(demoReceipts);
  const [issueDraft, setIssueDraft] = useState<DraftIssue>(defaultIssue);
  const [transferReceiptId, setTransferReceiptId] = useState("1");
  const [transferDestination, setTransferDestination] = useState("");
  const [redeemReceiptId, setRedeemReceiptId] = useState("1");
  const [issuerAddress, setIssuerAddress] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [mode, setMode] = useState<Mode>("issue");
  const [appPage, setAppPage] = useState<AppPage>("dashboard");
  const [path, setPath] = useState(() => window.location.pathname);
  const [activeReceiptIndex, setActiveReceiptIndex] = useState(0);

  const canOperate = walletAddress.length > 0;
  const activeReceipt = receipts[activeReceiptIndex] ?? receipts[0];

  const stats = useMemo(() => {
    const active = receipts.filter((r) => r.status === "Active");
    const redeemed = receipts.filter((r) => r.status === "Redeemed");
    const totalKg = receipts.reduce((sum, r) => sum + Number(r.quantity_kg || 0), 0);
    return [
      { label: "Active receipts", value: active.length.toString(), icon: ClipboardCheck },
      { label: "Stored volume", value: `${totalKg.toLocaleString()}kg`, icon: Boxes },
      { label: "Certified stores", value: "18", icon: Warehouse },
      { label: "Redeemed lots", value: redeemed.length.toString(), icon: PackageCheck },
    ];
  }, [receipts]);

  const networkSummary = useMemo(
    () => `${stellarConfig.network.toUpperCase()} / ${stellarConfig.horizonUrl.replace("https://", "")}`,
    []
  );

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(nextPath: string) {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function connectWallet() {
    const connected = await isConnected();
    if (!connected.isConnected) {
      setStatus("Freighter is unavailable in this browser.");
      return;
    }

    const allowed = await isAllowed();
    if (!allowed.isAllowed) {
      await setAllowed();
    }

    const account = await getAddress();
    setWalletAddress(account.address);
    setStatus(`Connected ${shortAddress(account.address)}.`);
  }

  function issueLocalReceipt() {
    if (!issueDraft.owner || !issueDraft.metadataHash || !issueDraft.expiresAt) {
      setStatus("Owner, metadata hash, and expiry are required.");
      return;
    }

    const nextId = Math.max(...receipts.map((r) => r.receipt_id), 0) + 1;
    const now = Math.floor(Date.now() / 1000);
    const created: Receipt = {
      receipt_id: nextId,
      issuer: walletAddress || "issuer-not-connected",
      owner: issueDraft.owner,
      commodity: issueDraft.commodity,
      quantity_kg: issueDraft.quantityKg,
      grade: issueDraft.grade,
      warehouse_name: issueDraft.warehouse,
      location: issueDraft.location,
      metadata_hash: issueDraft.metadataHash,
      issued_at: now,
      expires_at: Math.floor(new Date(issueDraft.expiresAt).getTime() / 1000),
      status: "Active",
    };

    setReceipts((prev) => [created, ...prev]);
    setActiveReceiptIndex(0);
    setIssueDraft(defaultIssue);
    setStatus(`Receipt #${nextId} staged for contract invocation.`);
  }

  async function signMarkerTx(action: string) {
    if (!walletAddress) {
      setStatus("Connect wallet first.");
      return;
    }

    try {
      const fakeXdr = "AAAAAgAAAABQbGFjZWhvbGRlclRyYW5zYWN0aW9uAAAAAA==";
      await signTransaction(fakeXdr, {
        networkPassphrase: stellarConfig.networkPassphrase,
        address: walletAddress,
      });
      setStatus(`${action} signature request sent to Freighter.`);
    } catch {
      setStatus(`${action} signature rejected. Live contract ID: ${contractId}.`);
    }
  }

  function transferLocalReceipt() {
    const id = Number(transferReceiptId);
    if (!Number.isFinite(id) || !transferDestination) {
      setStatus("Transfer requires a receipt ID and destination.");
      return;
    }

    let changed = false;
    setReceipts((prev) =>
      prev.map((r) => {
        if (r.receipt_id === id && r.status === "Active") {
          changed = true;
          return { ...r, owner: transferDestination };
        }
        return r;
      })
    );

    setStatus(changed ? `Receipt #${id} transfer staged.` : "No active receipt found with that ID.");
  }

  function redeemLocalReceipt() {
    const id = Number(redeemReceiptId);
    if (!Number.isFinite(id) || !issuerAddress) {
      setStatus("Redeem requires a receipt ID and issuer address.");
      return;
    }

    let changed = false;
    setReceipts((prev) =>
      prev.map((r) => {
        if (r.receipt_id === id && r.status === "Active") {
          changed = true;
          return { ...r, status: "Redeemed", issuer: issuerAddress };
        }
        return r;
      })
    );

    setStatus(changed ? `Receipt #${id} redemption staged.` : "No active receipt found with that ID.");
  }

  const nextReceipt = () => setActiveReceiptIndex((idx) => (idx + 1) % receipts.length);
  const previousReceipt = () =>
    setActiveReceiptIndex((idx) => (idx - 1 + receipts.length) % receipts.length);

  if (path !== "/app") {
    return (
      <LandingPage
        networkSummary={networkSummary}
        theme={theme}
        onLaunch={() => navigate("/app")}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />
    );
  }

  return (
    <main className="crypto-shell" data-theme={theme}>
      <aside className="crypto-sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><Sprout size={20} /></div>
          <div>
            <strong>StellarCrop</strong>
            <span>Receipt finance</span>
          </div>
        </div>

        <nav className="crypto-nav">
          <button className={appPage === "dashboard" ? "active" : ""} type="button" onClick={() => setAppPage("dashboard")}><LayoutDashboard size={18} />Dashboard</button>
          <button className={appPage === "receipts" ? "active" : ""} type="button" onClick={() => setAppPage("receipts")}><Coins size={18} />Receipts</button>
          <button className={appPage === "transfers" ? "active" : ""} type="button" onClick={() => setAppPage("transfers")}><Send size={18} />Transfers</button>
          <button className={appPage === "markets" ? "active" : ""} type="button" onClick={() => setAppPage("markets")}><BarChart3 size={18} />Markets</button>
          <button className={appPage === "settings" ? "active" : ""} type="button" onClick={() => setAppPage("settings")}><Settings size={18} />Settings</button>
        </nav>

        <button className="sidebar-home" type="button" onClick={() => navigate("/")}>
          <Home size={17} />Back to site
        </button>
      </aside>

      <section className="crypto-main">
        <header className="crypto-header">
          <div className="search-box">
            <Search size={17} />
            <span>Search receipt ID, issuer, owner, commodity</span>
          </div>
          <div className="topbar-actions">
            <span className="network-pill"><ScanLine size={15} />{networkSummary}</span>
            <button className="icon-button" type="button" title="Notifications"><Bell size={18} /></button>
            <button className="icon-button" type="button" title="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="primary-button" type="button" onClick={connectWallet}>
              <Wallet size={18} />{walletAddress ? shortAddress(walletAddress) : "Connect"}
            </button>
          </div>
        </header>

        {appPage === "dashboard" && (
          <>
        <section className="portfolio-strip">
          <article className="balance-card primary-balance">
            <div>
              <span>Total commodity receipts</span>
              <strong>{stats[1].value}</strong>
              <p><TrendingUp size={15} />Collateral-ready stock across certified stores</p>
            </div>
            <CircleDollarSign size={38} />
          </article>

          {stats.filter((item) => item.label !== "Stored volume").map((item) => {
            const Icon = item.icon;
            return (
              <article className="balance-card" key={item.label}>
                <Icon size={22} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            );
          })}
        </section>

        <section className="crypto-grid">
          <section className="trade-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Actions</p>
                <h2>Receipt operations</h2>
              </div>
              <span className={canOperate ? "state good" : "state"}>{canOperate ? "Wallet linked" : "Wallet required"}</span>
            </div>

            <div className="mode-tabs" role="tablist">
              <button className={mode === "issue" ? "active" : ""} type="button" onClick={() => setMode("issue")}><FilePlus2 size={16} />Issue</button>
              <button className={mode === "transfer" ? "active" : ""} type="button" onClick={() => setMode("transfer")}><ArrowLeftRight size={16} />Transfer</button>
              <button className={mode === "redeem" ? "active" : ""} type="button" onClick={() => setMode("redeem")}><BadgeCheck size={16} />Redeem</button>
            </div>

            {mode === "issue" && (
              <div className="form-grid app-form-grid">
                <label>Farmer address<input value={issueDraft.owner} onChange={(e) => setIssueDraft({ ...issueDraft, owner: e.target.value })} /></label>
                <label>Commodity<input value={issueDraft.commodity} onChange={(e) => setIssueDraft({ ...issueDraft, commodity: e.target.value })} /></label>
                <label>Quantity kg<input value={issueDraft.quantityKg} onChange={(e) => setIssueDraft({ ...issueDraft, quantityKg: e.target.value })} /></label>
                <label>Grade<input value={issueDraft.grade} onChange={(e) => setIssueDraft({ ...issueDraft, grade: e.target.value })} /></label>
                <label>Warehouse<input value={issueDraft.warehouse} onChange={(e) => setIssueDraft({ ...issueDraft, warehouse: e.target.value })} /></label>
                <label>Location<input value={issueDraft.location} onChange={(e) => setIssueDraft({ ...issueDraft, location: e.target.value })} /></label>
                <label className="wide">Metadata hash<input value={issueDraft.metadataHash} onChange={(e) => setIssueDraft({ ...issueDraft, metadataHash: e.target.value })} /></label>
                <label>Expiry<input type="datetime-local" value={issueDraft.expiresAt} onChange={(e) => setIssueDraft({ ...issueDraft, expiresAt: e.target.value })} /></label>
                <div className="button-cluster">
                  <button className="primary-button" disabled={!canOperate} type="button" onClick={issueLocalReceipt}><FilePlus2 size={17} />Stage issue</button>
                  <button className="secondary-button" disabled={!canOperate} type="button" onClick={() => signMarkerTx("Issue")}><RefreshCw size={16} />Sign</button>
                </div>
              </div>
            )}

            {mode === "transfer" && (
              <div className="form-grid compact-form">
                <label>Receipt ID<input value={transferReceiptId} onChange={(e) => setTransferReceiptId(e.target.value)} /></label>
                <label className="wide">Destination address<input value={transferDestination} onChange={(e) => setTransferDestination(e.target.value)} /></label>
                <div className="button-cluster">
                  <button className="primary-button" disabled={!canOperate} type="button" onClick={transferLocalReceipt}><ArrowLeftRight size={17} />Stage transfer</button>
                  <button className="secondary-button" disabled={!canOperate} type="button" onClick={() => signMarkerTx("Transfer")}><RefreshCw size={16} />Sign</button>
                </div>
              </div>
            )}

            {mode === "redeem" && (
              <div className="form-grid compact-form">
                <label>Receipt ID<input value={redeemReceiptId} onChange={(e) => setRedeemReceiptId(e.target.value)} /></label>
                <label className="wide">Issuer address<input value={issuerAddress} onChange={(e) => setIssuerAddress(e.target.value)} /></label>
                <div className="button-cluster">
                  <button className="primary-button" disabled={!canOperate} type="button" onClick={redeemLocalReceipt}><PackageCheck size={17} />Stage redeem</button>
                  <button className="secondary-button" disabled={!canOperate} type="button" onClick={() => signMarkerTx("Redeem")}><RefreshCw size={16} />Sign</button>
                </div>
              </div>
            )}

            <div className="status-line">{status}</div>
          </section>

          <aside className="wallet-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Receipt wallet</p>
                <h2>Active position</h2>
              </div>
              <div className="carousel-buttons">
                <button className="icon-button" title="Previous receipt" type="button" onClick={previousReceipt}><ChevronLeft size={18} /></button>
                <button className="icon-button" title="Next receipt" type="button" onClick={nextReceipt}><ChevronRight size={18} /></button>
              </div>
            </div>
            <article className="crypto-receipt-card" key={activeReceipt.receipt_id}>
              <div className="asset-token">{activeReceipt.commodity.slice(0, 2).toUpperCase()}</div>
              <h3>{activeReceipt.quantity_kg}kg {activeReceipt.commodity}</h3>
              <p>{activeReceipt.grade} grade / {activeReceipt.warehouse_name}</p>
              <div className="asset-meta">
                <span>Owner<strong>{shortAddress(activeReceipt.owner)}</strong></span>
                <span>Status<strong>{activeReceipt.status}</strong></span>
                <span>Location<strong>{activeReceipt.location}</strong></span>
                <span>Hash<strong>{shortAddress(activeReceipt.metadata_hash)}</strong></span>
              </div>
            </article>
          </aside>
        </section>

        <section className="exchange-grid">
          <section className="ledger-panel crypto-table-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Assets</p>
                <h2>Receipt portfolio</h2>
              </div>
              <div className="contract-chip compact">
                <ShieldCheck size={16} />
                <span>{contractId}</span>
                <button className="ghost-icon" title="Copy contract ID" type="button" onClick={() => navigator.clipboard?.writeText(contractId)}><Copy size={15} /></button>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Balance</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Warehouse</th>
                    <th>Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr key={r.receipt_id} onClick={() => setActiveReceiptIndex(receipts.findIndex((item) => item.receipt_id === r.receipt_id))}>
                      <td>#{r.receipt_id} {r.commodity.toUpperCase()}</td>
                      <td>{r.quantity_kg}kg / {r.grade}</td>
                      <td>{shortAddress(r.owner)}</td>
                      <td><span className={r.status === "Active" ? "table-state active" : "table-state"}>{r.status}</span></td>
                      <td>{r.warehouse_name}</td>
                      <td>{toDateTime(r.expires_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="side-stack">
            <section className="market-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Markets</p>
                  <h2>Receipt lanes</h2>
                </div>
                <CircleDollarSign size={20} />
              </div>
              {corridors.map((lane) => (
                <div className="lane" key={lane.market}>
                  <span>{lane.market}<strong>{lane.crop}</strong></span>
                  <span>{lane.volume}<strong>{lane.change}</strong></span>
                </div>
              ))}
            </section>

            <section className="activity-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Transactions</p>
                  <h2>Recent activity</h2>
                </div>
                <Banknote size={20} />
              </div>
              {activity.map((item) => (
                <div className="activity-item" key={item.label}>
                  <span>{item.time}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                </div>
              ))}
            </section>
          </aside>
        </section>
          </>
        )}

        {appPage === "receipts" && (
          <section className="app-page-grid">
            <section className="ledger-panel crypto-table-panel span-wide">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Receipts</p>
                  <h2>Tokenized warehouse claims</h2>
                </div>
                <button className="primary-button" type="button" onClick={() => setMode("issue")}><FilePlus2 size={17} />New receipt</button>
              </div>
              <div className="receipt-card-grid">
                {receipts.map((receipt) => (
                  <article className="mini-asset-card" key={receipt.receipt_id} onClick={() => setActiveReceiptIndex(receipts.findIndex((item) => item.receipt_id === receipt.receipt_id))}>
                    <div className="asset-token">{receipt.commodity.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <strong>#{receipt.receipt_id} {receipt.commodity}</strong>
                      <span>{receipt.quantity_kg}kg / {receipt.grade} grade</span>
                    </div>
                    <span className={receipt.status === "Active" ? "table-state active" : "table-state"}>{receipt.status}</span>
                    <p>{receipt.warehouse_name} / {receipt.location}</p>
                  </article>
                ))}
              </div>
            </section>
            <aside className="wallet-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Selected</p>
                  <h2>Receipt detail</h2>
                </div>
              </div>
              <article className="crypto-receipt-card">
                <div className="asset-token">{activeReceipt.commodity.slice(0, 2).toUpperCase()}</div>
                <h3>{activeReceipt.quantity_kg}kg {activeReceipt.commodity}</h3>
                <p>{activeReceipt.warehouse_name}</p>
                <div className="asset-meta">
                  <span>Owner<strong>{shortAddress(activeReceipt.owner)}</strong></span>
                  <span>Issuer<strong>{shortAddress(activeReceipt.issuer)}</strong></span>
                  <span>Expires<strong>{toDateTime(activeReceipt.expires_at)}</strong></span>
                  <span>Proof<strong>{shortAddress(activeReceipt.metadata_hash)}</strong></span>
                </div>
              </article>
            </aside>
          </section>
        )}

        {appPage === "transfers" && (
          <section className="app-page-grid">
            <section className="trade-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Transfers</p>
                  <h2>Move receipt ownership</h2>
                </div>
                <span className={canOperate ? "state good" : "state"}>{canOperate ? "Wallet linked" : "Wallet required"}</span>
              </div>
              <div className="form-grid compact-form">
                <label>Receipt ID<input value={transferReceiptId} onChange={(e) => setTransferReceiptId(e.target.value)} /></label>
                <label className="wide">Destination wallet<input value={transferDestination} onChange={(e) => setTransferDestination(e.target.value)} /></label>
                <div className="button-cluster">
                  <button className="primary-button" disabled={!canOperate} type="button" onClick={transferLocalReceipt}><Send size={17} />Stage transfer</button>
                  <button className="secondary-button" disabled={!canOperate} type="button" onClick={() => signMarkerTx("Transfer")}><RefreshCw size={16} />Sign</button>
                </div>
              </div>
              <div className="status-line">{status}</div>
            </section>
            <section className="activity-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Queue</p>
                  <h2>Recent transfer activity</h2>
                </div>
                <ArrowLeftRight size={20} />
              </div>
              {activity.map((item) => (
                <div className="activity-item" key={item.label}>
                  <span>{item.time}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                </div>
              ))}
            </section>
          </section>
        )}

        {appPage === "markets" && (
          <section className="app-page-grid">
            <section className="market-panel span-wide">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Markets</p>
                  <h2>Commodity receipt lanes</h2>
                </div>
                <TrendingUp size={20} />
              </div>
              <div className="market-grid">
                {corridors.map((lane) => (
                  <article className="market-card" key={lane.market}>
                    <span>{lane.market}</span>
                    <strong>{lane.crop}</strong>
                    <p>{lane.volume} active receipts</p>
                    <em>{lane.change}</em>
                  </article>
                ))}
              </div>
            </section>
            <section className="ledger-panel crypto-table-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Depth</p>
                  <h2>Tradable inventory preview</h2>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Market</th><th>Crop</th><th>Volume</th><th>Signal</th></tr></thead>
                  <tbody>
                    {corridors.map((lane) => (
                      <tr key={lane.market}><td>{lane.market}</td><td>{lane.crop}</td><td>{lane.volume}</td><td>{lane.change}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        )}

        {appPage === "settings" && (
          <section className="app-page-grid">
            <section className="trade-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Settings</p>
                  <h2>Workspace controls</h2>
                </div>
                <Settings size={20} />
              </div>
              <div className="settings-list">
                <label>Default network<input readOnly value={stellarConfig.network.toUpperCase()} /></label>
                <label>Contract ID<input readOnly value={contractId} /></label>
                <label>Connected wallet<input readOnly value={walletAddress || "Not connected"} /></label>
              </div>
            </section>
            <section className="activity-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Preferences</p>
                  <h2>Interface</h2>
                </div>
              </div>
              <button className="secondary-button settings-button" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />} Toggle theme
              </button>
              <button className="secondary-button settings-button" type="button" onClick={() => navigate("/")}>
                <Home size={18} /> Return to landing page
              </button>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}

interface LandingPageProps {
  networkSummary: string;
  theme: Theme;
  onLaunch: () => void;
  onToggleTheme: () => void;
}

function LandingPage({ networkSummary, theme, onLaunch, onToggleTheme }: LandingPageProps) {
  const features = [
    {
      icon: Warehouse,
      title: "Certified store issuance",
      detail: "Cooperatives and warehouses issue unique receipts for stored harvest lots.",
    },
    {
      icon: ShieldCheck,
      title: "On-chain lifecycle",
      detail: "Issue, transfer, and redeem states are represented by Soroban contract records.",
    },
    {
      icon: Landmark,
      title: "Collateral path",
      detail: "Receipts are structured so lending and collateral modules can be added later.",
    },
  ];

  const roadmap = [
    "Contract lifecycle hardening",
    "Typed Soroban web client",
    "Event indexer and receipt API",
    "Issuer onboarding workflow",
  ];

  return (
    <main className="landing-shell" data-theme={theme}>
      <div className="landing-texture" />
      <nav className="landing-nav">
        <div className="brand-lockup">
          <div className="brand-mark"><Sprout size={20} /></div>
          <div>
            <strong>StellarCrop</strong>
            <span>Open-source RWA infrastructure</span>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="network-pill"><ScanLine size={15} />{networkSummary}</span>
          <button className="icon-button" type="button" title="Toggle theme" onClick={onToggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="primary-button" type="button" onClick={onLaunch}>
            Launch app <ArrowRight size={18} />
          </button>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">Warehouse receipts for real-world harvests</p>
          <h1>Proof of stored crops that farmers can hold, transfer, and build credit around.</h1>
          <p>
            StellarCrop is an open-source Stellar project for digitizing agricultural warehouse
            receipts. It gives certified stores a lightweight way to issue receipts, gives farmers
            a portable proof of stored commodity, and gives contributors a clear path to build
            the missing infrastructure.
          </p>
          <div className="hero-actions">
            <button className="primary-button large" type="button" onClick={onLaunch}>
              Launch app <ArrowRight size={19} />
            </button>
            <a className="secondary-link" href="#contribution-roadmap">
              <GitBranch size={18} />View contribution tracks
            </a>
          </div>
        </div>

        <div className="hero-product">
          <div className="receipt-ticket landing-ticket">
            <div className="ticket-top">
              <span>#0042</span>
              <strong>Active</strong>
            </div>
            <h3>250kg cocoa</h3>
            <p>Grade A / Cooperative Vault, Ibadan</p>
            <div className="ticket-grid">
              <span>Issuer<strong>Certified warehouse</strong></span>
              <span>Network<strong>Stellar testnet</strong></span>
              <span>Lifecycle<strong>Issue to transfer to redeem</strong></span>
              <span>Proof<strong>Metadata hash stored</strong></span>
            </div>
            <div className="ticket-bar"><span style={{ width: "68%" }} /></div>
          </div>
        </div>
      </section>

      <section className="landing-band">
        <article>
          <Layers3 size={22} />
          <strong>What exists today</strong>
          <span>Soroban receipt registry, contract tests, wallet-ready frontend, docs, CI, and a polished product shell.</span>
        </article>
        <article>
          <MapPinned size={22} />
          <strong>Where contributors help</strong>
          <span>Real transaction wiring, event indexing, issuer admin flows, and contract lifecycle hardening.</span>
        </article>
        <article>
          <CircleDollarSign size={22} />
          <strong>Why it matters</strong>
          <span>Farmers can avoid harvest-glut selling by proving stored goods and preparing for collateral use.</span>
        </article>
      </section>

      <section className="landing-grid">
        <div className="feature-list">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="feature-row" key={feature.title}>
                <Icon size={22} />
                <div>
                  <h2>{feature.title}</h2>
                  <p>{feature.detail}</p>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="roadmap-panel" id="contribution-roadmap">
          <p className="eyebrow">Contribution roadmap</p>
          <h2>Ready to split into issues</h2>
          {roadmap.map((item, index) => (
            <div className="roadmap-item" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </div>
          ))}
          <button className="primary-button" type="button" onClick={onLaunch}>
            Inspect working app <ArrowRight size={18} />
          </button>
        </aside>
      </section>
    </main>
  );
}
