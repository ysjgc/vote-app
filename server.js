const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
// 数据目录支持环境变量覆盖（云端部署时可挂载持久磁盘到 DATA_DIR，防止重启丢数据）
const DATA_DIR_ENV = process.env.DATA_DIR || null;

// 投票截止时间：2026年8月27日 18:00
const DEADLINE = new Date('2026-08-27T18:00:00+08:00');
// 每个账号最多投票次数
const MAX_VOTES_PER_ACCOUNT = 3;
// 每人每次最多选择作品数
const MAX_PICKS_PER_VOTE = 3;

// ---------------- 作品数据 ----------------
const WORKS = [
  { id: 718, author: '张瀚文', title: '永远de小心肝' },
  { id: 703, author: '蒋毅', title: '深夜胸痛，3步救命—— 每一步都决定着生死' },
  { id: 331, author: '邓煜', title: '宫廷"孕"事——华妃逆袭记' },
  { id: 628, author: '张丽梅', title: '妊娠期糖尿病的诊断筛查与健康管理' },
  { id: 575, author: '胡雪刚', title: '智齿大闯关！是留还是拔？' },
  { id: 560, author: '吴文妙', title: '浪浪山健康体重修炼营' },
  { id: 504, author: '梁婷', title: '《嬢嬢们的快乐保卫战》' },
  { id: 450, author: '梁坤彦', title: '肠久之计' },
  { id: 445, author: '刘欢', title: '停止"肌"饿游戏，防治老年肌少症' },
  { id: 444, author: '余静', title: '"肌"活人生，远离肌少症' },
  { id: 422, author: '周文燕', title: '痛风？痛疯？' },
  { id: 365, author: '赵艳', title: '《别让胰腺替你买单》' },
  { id: 364, author: '胡珊珊', title: '糖尿病足防治课堂之胰岛素注射篇' },
  { id: 363, author: '欧秋果', title: '脚趾侦探日记：二趾的追凶之夜——糖尿病足宣传科普' },
  { id: 257, author: '包丹妮', title: '一只蚊子的危险档案' },
  { id: 299, author: '刘安宁', title: '一顿饭的代价' },
  { id: 252, author: '徐敏', title: '孕期穿越之体重保卫战' },
  { id: 160, author: '徐紫宸', title: '"点"亮健康：让早癌信号无处遁形' },
  { id: 131, author: '曹云星', title: 'ICU恐惧症门诊-治好你心里那个对ICU的"怕"' },
  { id: 37, author: '邓俊杰', title: '这一管血，为什么不能将就' },
  { id: 715, author: '白世平', title: '轻轻一摔就骨折？别让"沉默的疾病"偷走你的骨骼健康' },
  { id: 714, author: '万雅芳', title: '是谁"拨"动了你-国际标准化比值（INR）' },
  { id: 700, author: '吴倩倩', title: '渐冻症 = 身体被冻住？带你正确认识渐冻症' },
  { id: 505, author: '孟如妍', title: 'HIV检测试纸或许是对抗艾滋的关键一环！' },
  { id: 501, author: '郭元元', title: '检验科的"防翻车"指南：一张化验单是怎样炼成的？' },
  { id: 477, author: '李德剑', title: '精准治疗，凭什么"准"？——解码检验在个体化医疗中的关键角色' },
  { id: 430, author: '周华', title: '蜜蜂蜇伤：从红肿到休克，你需要了解的救命知识' },
  { id: 562, author: '黄根花', title: '如何"兜"住女性的"小房子" ——认识盆腔器官脱垂' },
  { id: 377, author: '杨晨', title: '把血压管稳：一场长期而可执行的健康行动' },
  { id: 376, author: '秦紫余', title: '管理糖尿病， 不只是"把糖降下来"' },
  { id: 453, author: '陈刘', title: '甲亢还是假亢？别被化验单骗了！' },
  { id: 476, author: '陈欢', title: '一管血测遍上百种代谢物：核磁共振如何成为检验医学的"全景侦察兵"？' },
  { id: 328, author: '赵广怡', title: '深夜"血压刺客"：鼾声越大，心脏越慌' },
  { id: 330, author: '雷胡芯', title: '认识"不传染的罕见水疱病"' },
  { id: 492, author: '李怡玲', title: '流式细胞术之亚群检测——让免疫力有据可依' },
  { id: 493, author: '颜令', title: '炭疽杆菌--来自动物的"黑色威胁"' },
  { id: 497, author: '肖江明', title: '室间质量评价小课堂' },
  { id: 421, author: '徐晓华', title: '"抗癌针"CAR-T治疗：恶性血液肿瘤患者的"救命稻草"' },
  { id: 737, author: '李勇', title: '发烧了，化验单上 PCT 是什么？' },
  { id: 619, author: '马陶', title: '血培养：发热待查时的"细菌捕手"' },
  { id: 615, author: '朱文俊', title: '性激素六项女性内分泌的"晴雨表"' },
  { id: 610, author: '刘东擘', title: '脾虚的"实验室密码"——消化吸收与生化指标' },
  { id: 608, author: '汤兴芳', title: '血气分析：人体酸碱平衡的"气象站"' },
  { id: 603, author: '张耀心', title: '一管血里的"红细胞运输队"：为什么总盯着血红蛋白' },
  { id: 596, author: '詹梅', title: '食物"过敏"还是"不耐受"？——IgE抗体与中医"脾胃不和"' },
  { id: 588, author: '王作龙', title: '维生素D缺乏与"阳气不足"——晒太阳也是一种补药' },
  { id: 584, author: '龙寿洪', title: '头晕乏力就是"气血虚"？化验单里藏着真相' },
  { id: 583, author: '张霞', title: '哮喘反复发作，你的"敌人"到底藏在哪？' },
  { id: 345, author: '杨丹', title: '骨骼王国的"正邪之战"' },
  { id: 322, author: '黄玉麒', title: 'HIV人体旅行记' },
  { id: 558, author: '柴娟', title: '晨尿里的健康密码：颜色、泡沫、验尿单上的"+"都有讲究' },
  { id: 580, author: '刘林', title: '体检报告上那个带"↑"的箭头，可能藏着中风的大秘密' },
  { id: 712, author: '温苡琳', title: '牙龈炎早筛与科学防护科普系列' },
  { id: 362, author: '邓陆琳', title: '"糖友的"降糖帮手"一览"' },
  { id: 264, author: '柯琳秋', title: '科学控体重，健康加速度-全生活化体重管理12条' },
  { id: 19, author: '吴绮楠', title: '代谢力就是抗癌力-吃动睡养防癌指南' }
];

// ---------------- 数据存储 ----------------
const DATA_DIR = DATA_DIR_ENV ? path.resolve(DATA_DIR_ENV) : path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'votes.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ votes: [] }, null, 2));
  }
}

function loadData() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    return { votes: [] };
  }
}

function saveData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 校验手机号格式（中国大陆 11 位手机号）
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// ---------------- 中间件 ----------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 微信域名归属验证文件（部署在根目录，用于微信中打开链接的域名验证）
app.get('/13ba2b05a49d9422977e8a47fd7ae30f.txt', (req, res) => {
  res.type('text/plain');
  res.send('bf0535670439179bf257fc1060cab0437038148d');
});

// ---------------- API ----------------

// 获取作品列表
app.get('/api/works', (req, res) => {
  res.json({ success: true, works: WORKS, deadline: DEADLINE.toISOString() });
});

// 提交投票
app.post('/api/vote', (req, res) => {
  const { phone, name, picks } = req.body || {};

  // 校验手机号
  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: '请输入正确的 11 位手机号' });
  }
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: '请输入您的昵称' });
  }
  if (!Array.isArray(picks) || picks.length === 0) {
    return res.status(400).json({ success: false, message: '请至少选择 1 个作品' });
  }
  if (picks.length > MAX_PICKS_PER_VOTE) {
    return res.status(400).json({ success: false, message: `每次最多选择 ${MAX_PICKS_PER_VOTE} 个作品` });
  }

  // 校验作品 ID 是否合法且不重复
  const uniquePicks = [...new Set(picks)];
  const validIds = new Set(WORKS.map((w) => w.id));
  for (const id of uniquePicks) {
    if (!validIds.has(id)) {
      return res.status(400).json({ success: false, message: '包含无效的作品' });
    }
  }
  if (uniquePicks.length !== picks.length) {
    return res.status(400).json({ success: false, message: '请不要重复选择同一作品' });
  }

  // 校验截止时间
  const now = new Date();
  if (now > DEADLINE) {
    return res.status(400).json({ success: false, message: '投票已截止（截止时间：2026年8月27日 18:00）' });
  }

  const data = loadData();

  // 统计该账号已投票次数
  const accountVotes = data.votes.filter((v) => v.phone === phone).length;
  if (accountVotes >= MAX_VOTES_PER_ACCOUNT) {
    return res.status(400).json({ success: false, message: `该手机号已投票 ${accountVotes} 次，已达投票上限（${MAX_VOTES_PER_ACCOUNT} 次）` });
  }

  // 记录投票
  data.votes.push({
    phone,
    name: name.trim(),
    picks: uniquePicks,
    time: now.toISOString()
  });
  saveData(data);

  const remaining = MAX_VOTES_PER_ACCOUNT - (accountVotes + 1);
  res.json({
    success: true,
    message: `投票成功！该手机号还可投票 ${remaining} 次`,
    remaining
  });
});

// 查询账号投票情况
app.get('/api/account', (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ success: false, message: '缺少手机号' });
  }
  const data = loadData();
  const votes = data.votes.filter((v) => v.phone === phone);
  res.json({
    success: true,
    voted: votes.length,
    remaining: Math.max(0, MAX_VOTES_PER_ACCOUNT - votes.length),
    records: votes
  });
});

// 清空全部投票数据（带密钥保护，仅用于运维清理）
// 调用方式：GET /api/admin/reset?key=ADMIN_KEY（ADMIN_KEY 通过环境变量或下方默认值设置）
app.get('/api/admin/reset', (req, res) => {
  const key = req.query.key;
  const adminKey = process.env.ADMIN_RESET_KEY || 'Zt2026VoteAdminSecret';
  if (key !== adminKey) {
    return res.status(403).json({ success: false, message: '无权操作' });
  }
  const data = loadData();
  data.votes = [];
  saveData(data);
  res.json({ success: true, message: '投票数据已清空' });
});

// 导出投票数据（排行 + 明细，带密钥保护）
// 调用方式：GET /api/export?key=ADMIN_KEY&type=all|ranking|detail
app.get('/api/export', (req, res) => {
  const key = req.query.key;
  const type = req.query.type || 'all';
  const adminKey = process.env.ADMIN_RESET_KEY || 'Zt2026VoteAdminSecret';
  if (key !== adminKey) {
    return res.status(403).json({ success: false, message: '无权操作' });
  }

  const data = loadData();

  // 排行数据
  const stats = WORKS.map((w) => {
    let votes = 0;
    for (const v of data.votes) {
      if (v.picks.includes(w.id)) votes++;
    }
    return { rank: 0, id: w.id, author: w.author, title: w.title, votes };
  });
  stats.sort((a, b) => b.votes - a.votes);
  stats.forEach((s, i) => { s.rank = i + 1; });

  // 明细数据（把作品ID翻译成作品名）
  const idToTitle = {};
  WORKS.forEach((w) => { idToTitle[w.id] = w.title; });
  const details = data.votes.map((v, i) => ({
    seq: i + 1,
    phone: v.phone,
    name: v.name,
    picks: v.picks,
    picksTitle: v.picks.map((p) => idToTitle[p] || p),
    time: v.time
  }));

  if (type === 'ranking') {
    return res.json({ success: true, totalVotes: data.votes.length, totalPickCount: details.reduce((a, v) => a + v.picks.length, 0), ranking: stats });
  }
  if (type === 'detail') {
    return res.json({ success: true, totalVotes: data.votes.length, details });
  }
  res.json({
    success: true,
    totalVotes: data.votes.length,
    totalPickCount: details.reduce((a, v) => a + v.picks.length, 0),
    ranking: stats,
    details
  });
});

// 获取投票结果排行
app.get('/api/result', (req, res) => {
  const data = loadData();
  const stats = WORKS.map((w) => {
    let votes = 0;
    for (const v of data.votes) {
      if (v.picks.includes(w.id)) votes++;
    }
    return { id: w.id, author: w.author, title: w.title, votes };
  });
  stats.sort((a, b) => b.votes - a.votes);
  res.json({
    success: true,
    totalVotes: data.votes.length,
    totalPickCount: data.votes.reduce((acc, v) => acc + v.picks.length, 0),
    deadline: DEADLINE.toISOString(),
    results: stats
  });
});

// ---------------- 启动 ----------------
app.listen(PORT, () => {
  console.log(`投票系统已启动：http://localhost:${PORT}`);
});
