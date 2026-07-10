import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import {
  AdminService, AdminStats, AdminUser, AdminOrder, AdminDesign, AdminBlocked, AdminError, AdminSystem, AdminTicket,
} from '../../core/admin.service';

type Tab = 'panel' | 'users' | 'orders' | 'designs' | 'blocked' | 'support' | 'system';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="wrap">
    <header class="bar">
      <div class="ttl">🛡️ Yönetici Paneli</div>
      @if (isAdmin()) {
        <div class="who">{{ auth.user()?.email }} <button class="lnk" (click)="logout()">Çıkış</button></div>
      }
    </header>

    @if (!isAdmin()) {
      <!-- Admin giriş kapısı -->
      <div class="gate">
        <div class="card login">
          <h2>Yönetici Girişi</h2>
          @if (auth.loggedIn() && !isAdmin()) {
            <p class="err">Bu hesabın yönetici yetkisi yok.</p>
            <button class="btn ghost" (click)="logout()">Farklı hesapla gir</button>
          } @else {
            <input class="in" type="email" [(ngModel)]="email" placeholder="E-posta" autocomplete="email" />
            <div class="pw-wrap">
              <input class="in" [type]="showPw() ? 'text' : 'password'" [(ngModel)]="password" placeholder="Şifre" autocomplete="current-password" />
              <button type="button" class="eye" (click)="showPw.set(!showPw())">{{ showPw() ? '👁️' : '🙈' }}</button>
            </div>
            @if (loginErr()) { <p class="err">{{ loginErr() }}</p> }
            @if (loginInfo()) { <p class="info">{{ loginInfo() }}</p> }
            <button class="btn" [disabled]="busy()" (click)="login()">{{ busy() ? '...' : 'Giriş yap' }}</button>
            <button class="lnk-forgot" (click)="forgot()">Şifremi unuttum</button>
            <p class="hint">Bir hesabı yönetici yapmak için sunucuda:<br><code>node scripts/make-admin.js e-posta</code></p>
          }
        </div>
      </div>
    } @else {
      <!-- Sekmeler -->
      <nav class="tabs">
        @for (t of tabs; track t.key) {
          <button class="tab" [class.on]="tab() === t.key" (click)="go(t.key)">{{ t.label }}</button>
        }
      </nav>

      @if (err()) { <div class="banner">{{ err() }}</div> }

      <section class="content">
        @switch (tab()) {

          @case ('panel') {
            @if (stats(); as s) {
              <div class="grid">
                <div class="stat"><div class="n">{{ s.users }}</div><div class="l">Kullanıcı</div></div>
                <div class="stat"><div class="n">{{ s.paidUsers }}</div><div class="l">Aktif abone</div></div>
                <div class="stat"><div class="n">{{ s.verified }}</div><div class="l">Doğrulanmış</div></div>
                <div class="stat"><div class="n">{{ s.designs }}</div><div class="l">Tasarım</div></div>
                <div class="stat"><div class="n">{{ s.dailyDesigns }}</div><div class="l">Bugün üretim</div></div>
                <div class="stat gold"><div class="n">{{ s.revenue | number:'1.0-2' }}</div><div class="l">Gelir (ödenen)</div></div>
              </div>
            } @else { <p class="muted">Yükleniyor…</p> }
          }

          @case ('users') {
            <div class="toolbar">
              <input class="in flex" [(ngModel)]="q" (keyup.enter)="loadUsers()" placeholder="E-posta / telefon / isim ara…" />
              <button class="btn sm" (click)="loadUsers()">Ara</button>
            </div>
            <div class="tbl">
              <div class="tr th"><span>Kullanıcı</span><span>Plan</span><span>Hak</span><span>Rol</span><span>Durum</span><span></span></div>
              @for (u of users(); track u.id) {
                <div class="tr">
                  <span><b>{{ u.firstName }} {{ u.lastName }}</b><br><small class="muted">{{ u.email }} · {{ u.phone }}</small></span>
                  <span>{{ u.plan }}</span>
                  <span>{{ u.imagesExtra }} ek</span>
                  <span><span class="badge" [class.adm]="u.role === 'admin'">{{ u.role || 'user' }}</span></span>
                  <span>{{ u.verified ? '✓' : '—' }}</span>
                  <span class="act">
                    <button class="mini" (click)="edit(u)">Düzenle</button>
                    <button class="mini danger" (click)="removeUser(u)">Sil</button>
                  </span>
                </div>
                @if (editId() === u.id) {
                  <div class="editrow">
                    <label>Plan <input class="in xs" [(ngModel)]="ePlan" /></label>
                    <label>Ek görsel <input class="in xs" type="number" [(ngModel)]="eExtra" /></label>
                    <label>Rol
                      <select class="in xs" [(ngModel)]="eRole"><option value="user">user</option><option value="admin">admin</option></select>
                    </label>
                    <button class="btn sm" (click)="saveUser(u)">Kaydet</button>
                    <button class="mini" (click)="editId.set(0)">Vazgeç</button>
                  </div>
                }
              } @empty { <div class="tr"><span class="muted">Kayıt yok</span></div> }
            </div>
          }

          @case ('orders') {
            @if (orderSum(); as os) {
              <div class="grid three">
                <div class="stat"><div class="n">{{ os.count }}</div><div class="l">Sipariş</div></div>
                <div class="stat"><div class="n">{{ os.paid }}</div><div class="l">Ödenen</div></div>
                <div class="stat gold"><div class="n">{{ os.revenue | number:'1.0-2' }}</div><div class="l">Gelir</div></div>
              </div>
            }
            <div class="tbl">
              <div class="tr th o"><span>Ürün</span><span>Tutar</span><span>Sağlayıcı</span><span>Durum</span><span>Tarih</span></div>
              @for (o of orders(); track o.id) {
                <div class="tr o">
                  <span><b>{{ o.itemName }}</b><br><small class="muted">{{ o.kind }} · {{ o.userId }}</small></span>
                  <span>{{ o.amount | number:'1.0-2' }} {{ o.currency }}</span>
                  <span>{{ o.provider }}</span>
                  <span><span class="badge" [class.ok]="o.status === 'paid'">{{ o.status }}</span></span>
                  <span class="muted">{{ o.createdAt | date:'short' }}</span>
                </div>
              } @empty { <div class="tr"><span class="muted">Sipariş yok</span></div> }
            </div>
          }

          @case ('designs') {
            <div class="tbl">
              <div class="tr th d"><span>Ad</span><span>Kategori</span><span>Kaynak</span><span>Popüler</span><span></span></div>
              @for (d of designs(); track d.id) {
                <div class="tr d">
                  <span><b>{{ d.name }}</b></span>
                  <span>{{ d.category }}</span>
                  <span class="muted">{{ d.source }}</span>
                  <span>{{ d.popular ? '⭐' : '—' }}</span>
                  <span class="act">
                    <button class="mini" (click)="togglePopular(d)">{{ d.popular ? 'Kaldır' : 'Öne çıkar' }}</button>
                    <button class="mini danger" (click)="removeDesign(d)">Sil</button>
                  </span>
                </div>
              } @empty { <div class="tr"><span class="muted">Tasarım yok</span></div> }
            </div>
          }

          @case ('blocked') {
            <p class="muted small">40 gün kayıt engelli e-posta/telefonlar. Kaldırırsan o kişi hemen yeniden kayıt olabilir.</p>
            <div class="tbl">
              <div class="tr th b"><span>E-posta</span><span>Telefon</span><span>Bitiş</span><span></span></div>
              @for (x of blocked(); track x.id) {
                <div class="tr b">
                  <span>{{ x.email }}</span>
                  <span>{{ x.phone }}</span>
                  <span class="muted">{{ x.until | date:'short' }}</span>
                  <span class="act"><button class="mini" (click)="unblock(x)">Engeli kaldır</button></span>
                </div>
              } @empty { <div class="tr"><span class="muted">Engelli kayıt yok</span></div> }
            </div>
          }

          @case ('support') {
            @if (ticketSum(); as ts) {
              <div class="grid three">
                <div class="stat"><div class="n">{{ ts.total }}</div><div class="l">Toplam mesaj</div></div>
                <div class="stat" [class.warn]="ts.open > 0"><div class="n">{{ ts.open }}</div><div class="l">Açık (yeni)</div></div>
              </div>
            }
            <p class="muted small">Kullanıcıların "Yardım / Destek" kutusundan yazdığı sorunlar. Yanıt için e-postalarını kullanabilirsin.</p>
            <div class="tbl">
              @for (t of tickets(); track t.id) {
                <div class="ticket" [class.closed]="t.status === 'closed'">
                  <div class="tk-head">
                    <span class="tk-who"><b>{{ t.name || 'İsimsiz kullanıcı' }}</b> <small class="muted">{{ t.email || 'e-posta yok' }}</small></span>
                    <span class="tk-meta">
                      <span class="badge" [class.ok]="t.status === 'replied'" [class.cls]="t.status === 'closed'">{{ stLabel(t.status) }}</span>
                      <small class="muted">{{ t.createdAt | date:'short' }}</small>
                    </span>
                  </div>
                  <p class="tk-msg">{{ t.message }}</p>
                  @if (t.reply) {
                    <div class="tk-reply"><span class="tk-reply-lbl">Yanıtın:</span> {{ t.reply }}</div>
                  }
                  @if (replyId() === t.id) {
                    <textarea class="in tk-ta" rows="3" [(ngModel)]="replyText" placeholder="Yanıtını buraya yaz… (kullanıcı uygulamada görecek)"></textarea>
                    <div class="tk-act">
                      <button class="btn sm" (click)="sendReply(t)">Yanıtı gönder</button>
                      <button class="mini" (click)="replyId.set(0)">Vazgeç</button>
                    </div>
                  } @else {
                    <div class="tk-act">
                      <button class="mini gold" (click)="startReply(t)">{{ t.reply ? 'Yanıtı düzenle' : 'Yanıtla' }}</button>
                      @if (t.email) { <a class="mini" [href]="'mailto:' + t.email">E-posta ile</a> }
                      <button class="mini" (click)="toggleTicket(t)">{{ t.status === 'closed' ? 'Yeniden aç' : 'Kapat' }}</button>
                      <button class="mini danger" (click)="removeTicket(t)">Sil</button>
                    </div>
                  }
                </div>
              } @empty { <div class="tr"><span class="muted">Henüz destek mesajı yok</span></div> }
            </div>
          }

          @case ('system') {
            @if (system(); as s) {
              <div class="grid three">
                <div class="stat"><div class="n">{{ s.db ? '✓' : '✕' }}</div><div class="l">Veritabanı</div></div>
                <div class="stat"><div class="n" style="font-size:16px">{{ s.ai.provider || 'demo' }}</div><div class="l">AI</div></div>
                <div class="stat"><div class="n" style="font-size:16px">{{ s.sms }}</div><div class="l">SMS</div></div>
                <div class="stat"><div class="n">{{ s.mailer ? '✓' : 'demo' }}</div><div class="l">E-posta</div></div>
                <div class="stat"><div class="n">{{ s.uptime }}s</div><div class="l">Çalışma süresi</div></div>
                <div class="stat" [class.warn]="s.maintenance">
                  <div class="n">{{ s.maintenance ? 'AÇIK' : 'kapalı' }}</div><div class="l">Bakım modu</div>
                </div>
              </div>
              <div class="maint">
                <button class="btn" [class.danger]="!s.maintenance" (click)="toggleMaint(!s.maintenance)">
                  {{ s.maintenance ? 'Bakım modunu KAPAT' : 'Bakım moduna AL' }}
                </button>
                <span class="muted small">Bakım modunda kullanıcılar için AI/ödeme uçları geçici olarak durur; yönetici erişimi açık kalır.</span>
              </div>
            }
            <div class="errhead">
              <h3>Hata Günlüğü ({{ errors().length }})</h3>
              <button class="mini" (click)="clearErrors()">Temizle</button>
            </div>
            <div class="log">
              @for (e of errors(); track $index) {
                <div class="line" [class.warnline]="e.level === 'warn'">
                  <span class="lv">{{ e.level }}</span>
                  <span class="src">{{ e.source }}</span>
                  <span class="msg">{{ e.message }}</span>
                  <span class="tm muted">{{ e.createdAt | date:'HH:mm:ss' }}</span>
                </div>
              } @empty { <p class="muted">Hata yok 🎉</p> }
            </div>
          }
        }
      </section>
    }
  </div>
  `,
  styles: [`
    :host { display:block; min-height:100vh; background:var(--bg, #0c0a08); color:var(--ink, #fff8e7); }
    .wrap { max-width:960px; margin:0 auto; padding:14px 16px 90px; }
    .bar { display:flex; justify-content:space-between; align-items:center; padding:8px 0 14px; }
    .ttl { font-size:20px; font-weight:700; color:var(--gold-soft, #e9d9a0); }
    .who { font-size:12px; color:var(--muted, #b8ad97); }
    .lnk { background:none; border:none; color:var(--gold, #d4af37); cursor:pointer; font-size:12px; }
    .gate { display:flex; justify-content:center; padding-top:40px; }
    .card { background:var(--bg-2, #141019); border:1px solid var(--line, #2c2418); border-radius:16px; padding:22px; }
    .login { width:320px; max-width:100%; display:flex; flex-direction:column; gap:10px; }
    .login h2 { font-size:18px; margin-bottom:4px; }
    .in { width:100%; padding:11px 13px; border-radius:12px; border:1px solid var(--line,#2c2418); background:#000; color:var(--ink,#fff8e7); font-size:14px; }
    .in.xs { padding:6px 8px; font-size:12px; width:90px; }
    .in.flex { flex:1; }
    .btn { padding:11px 16px; border:none; border-radius:22px; font-weight:700; font-size:14px; cursor:pointer;
      background:linear-gradient(135deg,#f3e5a8,#d4af37 45%,#b8912e); color:#1a1405; }
    .btn.sm { padding:8px 14px; font-size:12px; }
    .btn.ghost { background:transparent; color:var(--gold-soft,#e9d9a0); border:1px solid var(--gold-deep,#b8912e); }
    .btn.danger { background:#8b2130; color:#fff; }
    .btn:disabled { opacity:.6; }
    .hint { font-size:11px; color:var(--muted,#b8ad97); margin-top:4px; line-height:1.5; }
    .hint code { color:var(--gold-soft,#e9d9a0); }
    .err { color:#e88; font-size:13px; }
    .info { color:var(--gold-soft,#e9d9a0); font-size:12.5px; word-break:break-all; }
    .pw-wrap { position:relative; }
    .pw-wrap .in { padding-inline-end:44px; }
    .eye { position:absolute; inset-inline-end:6px; top:50%; transform:translateY(-50%);
      background:transparent; border:none; cursor:pointer; font-size:16px; line-height:1; padding:6px; }
    .lnk-forgot { background:none; border:none; color:var(--gold-soft,#e9d9a0); font-size:12.5px; cursor:pointer; padding:4px; align-self:center; }
    .tabs { display:flex; gap:6px; overflow-x:auto; padding-bottom:10px; }
    .tab { flex:0 0 auto; padding:8px 14px; border-radius:20px; border:1px solid var(--line,#2c2418); background:#000; color:var(--muted,#b8ad97); font-size:13px; cursor:pointer; }
    .tab.on { border-color:var(--gold,#d4af37); color:var(--gold-soft,#e9d9a0); background:linear-gradient(180deg,#221c0c,#151109); }
    .banner { background:#3a1720; border:1px solid #6b2130; color:#f2b8c0; padding:10px 12px; border-radius:10px; margin-bottom:10px; font-size:13px; }
    .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px; }
    .grid.three { grid-template-columns:repeat(3,1fr); }
    .stat { background:var(--bg-2,#141019); border:1px solid var(--line,#2c2418); border-radius:14px; padding:14px; text-align:center; }
    .stat .n { font-size:26px; font-weight:800; color:var(--ink,#fff8e7); }
    .stat .l { font-size:11px; color:var(--muted,#b8ad97); margin-top:4px; }
    .stat.gold { border-color:var(--gold-deep,#b8912e); }
    .stat.gold .n { color:var(--gold-soft,#e9d9a0); }
    .stat.warn { border-color:#8b2130; }
    .stat.warn .n { color:#f2b8c0; }
    .toolbar { display:flex; gap:8px; margin-bottom:10px; }
    .tbl { display:flex; flex-direction:column; border:1px solid var(--line,#2c2418); border-radius:12px; overflow:hidden; }
    .tr { display:grid; grid-template-columns:2.2fr 1fr 1fr 1fr .8fr 1.4fr; gap:8px; padding:10px 12px; border-bottom:1px solid var(--line,#2c2418); align-items:center; font-size:13px; }
    .tr.o { grid-template-columns:2fr 1.2fr 1fr 1fr 1.2fr; }
    .tr.d { grid-template-columns:2fr 1fr 1fr .8fr 1.4fr; }
    .tr.b { grid-template-columns:2fr 1.4fr 1.2fr 1.2fr; }
    .tr.th { background:#0f0d0a; color:var(--gold-soft,#e9d9a0); font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.04em; }
    .tr:last-child { border-bottom:none; }
    .act { display:flex; gap:6px; justify-content:flex-end; }
    .mini { padding:5px 9px; border-radius:12px; border:1px solid var(--line,#2c2418); background:#000; color:var(--gold-soft,#e9d9a0); font-size:11px; cursor:pointer; }
    .mini.danger { color:#e88; border-color:#5a2028; }
    .badge { font-size:11px; padding:2px 8px; border-radius:10px; background:#000; border:1px solid var(--line,#2c2418); color:var(--muted,#b8ad97); }
    .badge.adm { border-color:var(--gold,#d4af37); color:var(--gold-soft,#e9d9a0); }
    .badge.ok { border-color:#2f6b5e; color:#8fd6c4; }
    .editrow { display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap; padding:10px 12px; background:#0f0d0a; border-bottom:1px solid var(--line,#2c2418); }
    .editrow label { font-size:11px; color:var(--muted,#b8ad97); display:flex; flex-direction:column; gap:3px; }
    .muted { color:var(--muted,#b8ad97); }
    .small { font-size:12px; }
    .maint { display:flex; align-items:center; gap:12px; margin:14px 0; flex-wrap:wrap; }
    .errhead { display:flex; justify-content:space-between; align-items:center; margin:16px 0 8px; }
    .errhead h3 { font-size:14px; }
    .log { border:1px solid var(--line,#2c2418); border-radius:12px; max-height:340px; overflow:auto; }
    .line { display:grid; grid-template-columns:60px 80px 1fr 70px; gap:8px; padding:7px 10px; border-bottom:1px solid var(--line,#2c2418); font-size:12px; }
    .line .lv { color:#e88; text-transform:uppercase; font-weight:600; font-size:10px; }
    .line.warnline .lv { color:var(--gold,#d4af37); }
    .line .src { color:var(--muted,#b8ad97); font-size:10px; }
    .line .msg { color:var(--ink,#fff8e7); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .ticket { padding:12px 14px; border-bottom:1px solid var(--line,#2c2418); }
    .ticket:last-child { border-bottom:none; }
    .ticket.closed { opacity:.6; }
    .tk-head { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:6px; }
    .tk-who { font-size:13px; }
    .tk-meta { display:flex; align-items:center; gap:8px; }
    .tk-msg { margin:6px 0 10px; font-size:13px; line-height:1.55; color:var(--ink,#fff8e7); white-space:pre-wrap; word-break:break-word; }
    .tk-act { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
    .tk-act a.mini { text-decoration:none; }
    .mini.gold { border-color:var(--gold,#d4af37); color:var(--gold-soft,#e9d9a0); }
    .badge.cls { opacity:.7; }
    .tk-reply { margin:2px 0 10px; padding:8px 12px; border-radius:10px; background:#14180f; border:1px solid #2f3a1c;
      font-size:13px; line-height:1.5; color:#dfeccb; white-space:pre-wrap; word-break:break-word; }
    .tk-reply-lbl { color:var(--gold-soft,#e9d9a0); font-weight:700; font-size:11px; margin-right:6px; }
    .tk-ta { width:100%; min-height:70px; resize:vertical; margin:4px 0 8px; line-height:1.5; }
    @media(max-width:640px){ .grid{grid-template-columns:repeat(2,1fr)} .tr,.tr.o,.tr.d,.tr.b{grid-template-columns:1fr 1fr; row-gap:4px} }
  `],
})
export class AdminComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(AdminService);

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'panel', label: 'Genel' }, { key: 'support', label: '📩 Mesajlar' },
    { key: 'users', label: 'Kullanıcılar' }, { key: 'designs', label: 'Tasarımlar' },
    { key: 'blocked', label: 'Engeller' }, { key: 'system', label: 'Sistem' },
  ];

  readonly tab = signal<Tab>('panel');
  readonly isAdmin = computed(() => this.auth.user()?.role === 'admin');

  email = ''; password = '';
  readonly loginErr = signal<string | null>(null); readonly loginInfo = signal<string | null>(null);
  readonly busy = signal(false); readonly showPw = signal(false);
  readonly err = signal<string | null>(null);

  readonly stats = signal<AdminStats | null>(null);
  readonly users = signal<AdminUser[]>([]); q = '';
  readonly orders = signal<AdminOrder[]>([]); readonly orderSum = signal<{ count: number; paid: number; revenue: number } | null>(null);
  readonly designs = signal<AdminDesign[]>([]);
  readonly blocked = signal<AdminBlocked[]>([]);
  readonly errors = signal<AdminError[]>([]); readonly system = signal<AdminSystem | null>(null);
  readonly tickets = signal<AdminTicket[]>([]); readonly ticketSum = signal<{ total: number; open: number } | null>(null);
  readonly replyId = signal(0); replyText = '';

  readonly editId = signal(0); ePlan = ''; eExtra = 0; eRole = 'user';

  constructor() {
    if (this.auth.token() && !this.auth.user()) { this.auth.loadMe().then(() => { if (this.isAdmin()) this.loadPanel(); }); }
    else if (this.isAdmin()) this.loadPanel();
  }

  async login(): Promise<void> {
    this.loginErr.set(null); this.busy.set(true);
    const r = await this.auth.login(this.email.trim().toLowerCase(), this.password);
    this.busy.set(false);
    if (!r.ok) { this.loginErr.set(r.error || 'Giriş başarısız'); return; }
    if (!this.isAdmin()) { this.loginErr.set('Bu hesabın yönetici yetkisi yok.'); return; }
    this.loadPanel();
  }
  logout(): void { this.auth.logout(); }

  async forgot(): Promise<void> {
    this.loginErr.set(null); this.loginInfo.set(null);
    const email = this.email.trim().toLowerCase();
    if (!email) { this.loginErr.set('Önce e-posta adresinizi yazın.'); return; }
    this.busy.set(true);
    const r = await this.auth.forgot(email);
    this.busy.set(false);
    if (r.demoOtp) this.loginInfo.set('Sıfırlama kodu (demo): ' + r.demoOtp + ' — kodla sıfırlamak için uygulamadaki Profil › Şifremi unuttum ekranını kullanın.');
    else if (r.ok) this.loginInfo.set('Sıfırlama kodu e-postanıza gönderildi.');
    else this.loginErr.set(r.error || 'Gönderilemedi');
  }

  go(t: Tab): void {
    this.tab.set(t); this.err.set(null);
    if (t === 'panel') this.loadPanel();
    if (t === 'users') this.loadUsers();
    if (t === 'orders') this.loadOrders();
    if (t === 'designs') this.loadDesigns();
    if (t === 'blocked') this.loadBlocked();
    if (t === 'support') this.loadSupport();
    if (t === 'system') this.loadSystem();
  }

  private wrap<T>(p: Promise<T>, ok: (v: T) => void): void {
    p.then(ok).catch((e) => this.err.set(this.msg(e)));
  }
  private msg(e: unknown): string { const x = e as { error?: { error?: string } }; return x?.error?.error || 'Sunucu hatası (yetki veya bağlantı)'; }

  loadPanel(): void { this.wrap(this.api.stats(), (r) => this.stats.set(r.data)); }
  loadUsers(): void { this.wrap(this.api.users(this.q), (r) => this.users.set(r.users)); }
  loadOrders(): void { this.wrap(this.api.orders(), (r) => { this.orders.set(r.orders); this.orderSum.set(r.summary); }); }
  loadDesigns(): void { this.wrap(this.api.designs(), (r) => this.designs.set(r.designs)); }
  loadBlocked(): void { this.wrap(this.api.blocked(), (r) => this.blocked.set(r.blocked)); }
  loadSystem(): void { this.wrap(this.api.system(), (r) => this.system.set(r.data)); this.wrap(this.api.errors(), (r) => this.errors.set(r.errors)); }
  loadSupport(): void { this.wrap(this.api.support(), (r) => { this.tickets.set(r.tickets); this.ticketSum.set(r.summary); }); }
  toggleTicket(t: AdminTicket): void { this.wrap(this.api.toggleTicket(t.id), () => this.loadSupport()); }
  removeTicket(t: AdminTicket): void { if (confirm('Bu destek mesajı silinsin mi?')) this.wrap(this.api.deleteTicket(t.id), () => this.loadSupport()); }
  startReply(t: AdminTicket): void { this.replyId.set(t.id); this.replyText = t.reply || ''; }
  sendReply(t: AdminTicket): void {
    const r = this.replyText.trim();
    if (!r) { this.err.set('Yanıt boş olamaz'); return; }
    this.wrap(this.api.replyTicket(t.id, r), () => { this.replyId.set(0); this.replyText = ''; this.loadSupport(); });
  }
  stLabel(s: string): string { return s === 'replied' ? 'yanıtlandı' : s === 'closed' ? 'kapalı' : 'açık'; }

  edit(u: AdminUser): void { this.editId.set(u.id); this.ePlan = u.plan; this.eExtra = u.imagesExtra; this.eRole = u.role || 'user'; }
  saveUser(u: AdminUser): void {
    this.wrap(this.api.updateUser(u.id, { plan: this.ePlan, imagesExtra: Number(this.eExtra), role: this.eRole }), () => { this.editId.set(0); this.loadUsers(); });
  }
  removeUser(u: AdminUser): void { if (confirm(`${u.email} silinsin mi?`)) this.wrap(this.api.deleteUser(u.id), () => this.loadUsers()); }

  togglePopular(d: AdminDesign): void { this.wrap(this.api.togglePopular(d.id), () => this.loadDesigns()); }
  removeDesign(d: AdminDesign): void { if (confirm(`"${d.name}" silinsin mi?`)) this.wrap(this.api.deleteDesign(d.id), () => this.loadDesigns()); }
  unblock(x: AdminBlocked): void { this.wrap(this.api.unblock(x.id), () => this.loadBlocked()); }

  toggleMaint(on: boolean): void { this.wrap(this.api.setMaintenance(on), () => this.loadSystem()); }
  clearErrors(): void { this.wrap(this.api.clearErrors(), () => this.errors.set([])); }
}
