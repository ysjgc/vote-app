// 前端逻辑
(function () {
  'use strict';

  const MAX_PICKS = 3;
  let WORKS = [];
  let picked = new Set(); // 当前勾选的作品 ID
  let accountPhone = null;
  let accountRemaining = 0;

  const el = {
    phone: document.getElementById('phone'),
    name: document.getElementById('name'),
    accountStatus: document.getElementById('accountStatus'),
    worksDesc: document.getElementById('worksDesc'),
    searchInput: document.getElementById('searchInput'),
    searchHint: document.getElementById('searchHint'),
    worksGrid: document.getElementById('worksGrid'),
    pickedCount: document.getElementById('pickedCount'),
    resetBtn: document.getElementById('resetBtn'),
    submitBtn: document.getElementById('submitBtn'),
    toastWrap: document.getElementById('toastWrap')
  };

  // ---------- Toast ----------
  function toast(msg, type) {
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    el.toastWrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2600);
    setTimeout(() => t.remove(), 3000);
  }

  // ---------- 作品加载 ----------
  async function loadWorks() {
    try {
      const res = await fetch('/api/works');
      const data = await res.json();
      WORKS = data.works || [];
      el.worksDesc.textContent = '共 ' + WORKS.length + ' 个参赛作品，勾选你喜欢的作品（最多 3 个）。';
      renderWorks();
    } catch (e) {
      el.worksGrid.innerHTML = '<div class="empty-state">加载失败，请刷新重试</div>';
    }
  }

  // ---------- 检索 ----------
  function filterWorks() {
    const kw = el.searchInput.value.trim().toLowerCase();
    if (!kw) return WORKS;
    return WORKS.filter((w) => {
      return String(w.id).toLowerCase().includes(kw) ||
        w.author.toLowerCase().includes(kw) ||
        w.title.toLowerCase().includes(kw);
    });
  }

  // ---------- 渲染 ----------
  function renderWorks() {
    const list = filterWorks();
    el.searchHint.textContent = list.length > 0
      ? '找到 ' + list.length + ' 个作品'
      : '未找到匹配的作品，请更换关键词';

    if (list.length === 0) {
      el.worksGrid.innerHTML = '<div class="empty-state">没有找到符合条件的作品</div>';
      return;
    }

    el.worksGrid.innerHTML = list.map((w) => {
      const selected = picked.has(w.id);
      const disabled = picked.size >= MAX_PICKS && !selected;
      return '' +
        '<div class="work-card' + (selected ? ' selected' : '') + (disabled ? ' disabled' : '') + '" data-id="' + w.id + '">' +
          '<div class="check">✓</div>' +
          '<span class="w-id">ID ' + w.id + '</span>' +
          '<div class="w-title">' + escapeHtml(w.title) + '</div>' +
          '<div class="w-author">作者：' + escapeHtml(w.author) + '</div>' +
        '</div>';
    }).join('');

    el.pickedCount.textContent = picked.size;
    el.submitBtn.disabled = picked.size === 0;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- 勾选 ----------
  function togglePick(id) {
    id = Number(id);
    if (picked.has(id)) {
      picked.delete(id);
    } else {
      if (picked.size >= MAX_PICKS) {
        toast('最多只能选择 ' + MAX_PICKS + ' 个作品', 'error');
        return;
      }
      picked.add(id);
    }
    renderWorks();
  }

  // 事件委托
  el.worksGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.work-card');
    if (!card || card.classList.contains('disabled')) return;
    togglePick(card.dataset.id);
  });

  el.searchInput.addEventListener('input', renderWorks);

  el.resetBtn.addEventListener('click', () => {
    picked.clear();
    renderWorks();
    toast('已清空选择');
  });

  // ---------- 账号 ----------
  function checkAccount() {
    const phone = el.phone.value.trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showAccount('请输入正确的 11 位手机号', 'error');
      return;
    }
    fetch('/api/account?phone=' + encodeURIComponent(phone))
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          accountPhone = phone;
          accountRemaining = data.remaining;
          const voted = data.voted;
          if (voted > 0) {
            showAccount('该手机号已投票 ' + voted + ' 次，还可投票 ' + data.remaining + ' 次', 'success');
          } else {
            showAccount('身份验证成功，您还可投票 ' + data.remaining + ' 次', 'success');
          }
        }
      })
      .catch(() => {});
  }

  function showAccount(msg, type) {
    el.accountStatus.textContent = msg;
    el.accountStatus.className = 'account-status show ' + (type || '');
  }

  el.phone.addEventListener('blur', checkAccount);
  el.phone.addEventListener('change', checkAccount);

  // ---------- 提交 ----------
  el.submitBtn.addEventListener('click', async () => {
    const phone = el.phone.value.trim();
    const name = el.name.value.trim();

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast('请输入正确的 11 位手机号', 'error');
      el.phone.focus();
      return;
    }
    if (!name) {
      toast('请输入您的昵称', 'error');
      el.name.focus();
      return;
    }
    if (picked.size === 0) {
      toast('请至少选择 1 个作品', 'error');
      return;
    }

    el.submitBtn.disabled = true;
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, picks: [...picked] })
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message, 'success');
        picked.clear();
        renderWorks();
        checkAccount();
      } else {
        toast(data.message, 'error');
        el.submitBtn.disabled = picked.size === 0;
      }
    } catch (e) {
      toast('网络错误，请重试', 'error');
      el.submitBtn.disabled = picked.size === 0;
    }
  });

  // ---------- 初始化 ----------
  loadWorks();
})();
