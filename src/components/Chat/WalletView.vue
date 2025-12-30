<template>
  <div class="wallet-view">
    <!-- 钱包头部 -->
    <div class="wallet-header">
      <div class="balance-card">
        <div class="balance-info">
          <div class="balance-label">账户余额</div>
          <div class="balance-amount">¥{{ formatAmount(balance) }}</div>
        </div>
        <div class="balance-actions">
          <button class="action-btn primary" @click="showRechargeModal = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20m9-9H3"/>
            </svg>
            充值
          </button>
          <button class="action-btn secondary" @click="showWithdrawModal = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20m-9-9h18"/>
            </svg>
            提现
          </button>
        </div>
      </div>
    </div>

    <!-- 快捷功能 -->
    <div class="quick-actions">
      <div class="section-title">快捷功能</div>
      <div class="action-grid">
        <div class="quick-action-item" @click="showTransferModal = true">
          <div class="action-icon transfer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div class="action-label">转账</div>
        </div>
        <div class="quick-action-item" @click="showReceiveModal = true">
          <div class="action-icon receive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/>
              <polyline points="17,14 12,9 7,14"/>
              <line x1="12" y1="9" x2="12" y2="21"/>
            </svg>
          </div>
          <div class="action-label">收款</div>
        </div>
        <div class="quick-action-item" @click="showRedPacketModal = true">
          <div class="action-icon red-packet">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div class="action-label">红包</div>
        </div>
        <div class="quick-action-item" @click="showBillsView = true">
          <div class="action-icon bills">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <div class="action-label">账单</div>
        </div>
      </div>
    </div>

    <!-- 交易记录 -->
    <div class="transaction-history" v-if="!showBillsView">
      <div class="section-title">最近交易</div>
      <div class="transaction-list">
        <div 
          v-for="transaction in recentTransactions" 
          :key="transaction.id"
          class="transaction-item"
        >
          <div class="transaction-icon" :class="transaction.type">
            <component :is="getTransactionIcon(transaction.type)" />
          </div>
          <div class="transaction-info">
            <div class="transaction-title">{{ transaction.title }}</div>
            <div class="transaction-time">{{ formatTime(transaction.timestamp) }}</div>
          </div>
          <div class="transaction-amount" :class="transaction.type">
            {{ transaction.type === 'income' ? '+' : '-' }}¥{{ formatAmount(transaction.amount) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 账单详情视图 -->
    <div class="bills-view" v-if="showBillsView">
      <div class="bills-header">
        <button class="back-btn" @click="showBillsView = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        <div class="bills-title">账单详情</div>
        <div class="bills-filter">
          <select v-model="selectedMonth" class="month-select">
            <option v-for="month in availableMonths" :key="month" :value="month">
              {{ month }}
            </option>
          </select>
        </div>
      </div>
      <div class="bills-summary">
        <div class="summary-item">
          <div class="summary-label">本月收入</div>
          <div class="summary-amount income">+¥{{ formatAmount(monthlyIncome) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">本月支出</div>
          <div class="summary-amount expense">-¥{{ formatAmount(monthlyExpense) }}</div>
        </div>
      </div>
      <div class="transaction-list">
        <div 
          v-for="transaction in allTransactions" 
          :key="transaction.id"
          class="transaction-item"
        >
          <div class="transaction-icon" :class="transaction.type">
            <component :is="getTransactionIcon(transaction.type)" />
          </div>
          <div class="transaction-info">
            <div class="transaction-title">{{ transaction.title }}</div>
            <div class="transaction-time">{{ formatTime(transaction.timestamp) }}</div>
          </div>
          <div class="transaction-amount" :class="transaction.type">
            {{ transaction.type === 'income' ? '+' : '-' }}¥{{ formatAmount(transaction.amount) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 转账模态框 -->
    <div v-if="showTransferModal" class="modal-overlay" @click="showTransferModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>转账</h3>
          <button class="close-btn" @click="showTransferModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>收款人</label>
            <input v-model="transferData.recipient" type="text" placeholder="请输入收款人账号或手机号" />
          </div>
          <div class="form-group">
            <label>转账金额</label>
            <input v-model="transferData.amount" type="number" placeholder="请输入转账金额" />
          </div>
          <div class="form-group">
            <label>转账备注</label>
            <input v-model="transferData.note" type="text" placeholder="请输入转账备注（可选）" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="showTransferModal = false">取消</button>
          <button class="btn primary" @click="handleTransfer">确认转账</button>
        </div>
      </div>
    </div>

    <!-- 其他模态框（充值、提现、收款、红包）可以类似实现 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  title: string
  amount: number
  timestamp: number
  category: string
}

// 钱包余额
const balance = ref(1288.50)

// 模态框状态
const showRechargeModal = ref(false)
const showWithdrawModal = ref(false)
const showTransferModal = ref(false)
const showReceiveModal = ref(false)
const showRedPacketModal = ref(false)
const showBillsView = ref(false)

// 转账数据
const transferData = ref({
  recipient: '',
  amount: '',
  note: ''
})

// 选中的月份
const selectedMonth = ref('2025年12月')

// 可选月份
const availableMonths = ref([
  '2025年12月',
  '2025年11月',
  '2025年10月',
  '2025年09月'
])

// 交易记录
const allTransactions = ref<Transaction[]>([
  {
    id: '1',
    type: 'expense',
    title: '转账给张三',
    amount: 100.00,
    timestamp: Date.now() - 3600000,
    category: 'transfer'
  },
  {
    id: '2',
    type: 'income',
    title: '收到红包',
    amount: 88.88,
    timestamp: Date.now() - 7200000,
    category: 'red_packet'
  },
  {
    id: '3',
    type: 'expense',
    title: '充值话费',
    amount: 50.00,
    timestamp: Date.now() - 86400000,
    category: 'recharge'
  },
  {
    id: '4',
    type: 'income',
    title: '朋友转账',
    amount: 200.00,
    timestamp: Date.now() - 172800000,
    category: 'transfer'
  },
  {
    id: '5',
    type: 'expense',
    title: '发红包',
    amount: 66.66,
    timestamp: Date.now() - 259200000,
    category: 'red_packet'
  }
])

// 最近交易（只显示前3条）
const recentTransactions = computed(() => {
  return allTransactions.value.slice(0, 3)
})

// 月度收入
const monthlyIncome = computed(() => {
  return allTransactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
})

// 月度支出
const monthlyExpense = computed(() => {
  return allTransactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
})

// 格式化金额
const formatAmount = (amount: number) => {
  return amount.toFixed(2)
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 86400000) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 172800000) {
    return '昨天'
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  }
}

// 获取交易图标
const getTransactionIcon = (type: string) => {
  if (type === 'income') {
    return {
      template: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/>
          <polyline points="17,14 12,9 7,14"/>
          <line x1="12" y1="9" x2="12" y2="21"/>
        </svg>
      `
    }
  } else {
    return {
      template: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      `
    }
  }
}

// 处理转账
const handleTransfer = () => {
  if (!transferData.value.recipient || !transferData.value.amount) {
    alert('请填写完整的转账信息')
    return
  }

  const amount = parseFloat(transferData.value.amount)
  if (amount <= 0 || amount > balance.value) {
    alert('转账金额无效')
    return
  }

  // 这里应该调用API进行转账
  console.log('转账:', transferData.value)

  // 更新余额
  balance.value -= amount

  // 添加交易记录
  allTransactions.value.unshift({
    id: Date.now().toString(),
    type: 'expense',
    title: `转账给${transferData.value.recipient}`,
    amount: amount,
    timestamp: Date.now(),
    category: 'transfer'
  })

  // 重置表单
  transferData.value = {
    recipient: '',
    amount: '',
    note: ''
  }

  showTransferModal.value = false
  alert('转账成功')
}
</script>

<style scoped>
.wallet-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  overflow-y: auto;
}

.wallet-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.balance-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.balance-info {
  text-align: center;
  margin-bottom: 20px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}

.balance-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
}

.action-btn.primary:hover {
  background: white;
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.8);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.quick-actions {
  padding: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 16px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.quick-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.quick-action-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #e9ecef;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.action-icon.transfer {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.action-icon.receive {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.action-icon.red-packet {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}

.action-icon.bills {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
}

.action-icon svg {
  width: 24px;
  height: 24px;
}

.action-label {
  font-size: 12px;
  font-weight: 500;
  color: #495057;
}

.transaction-history {
  flex: 1;
  padding: 0 20px 20px;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.transaction-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.transaction-icon.income {
  background: #28a745;
}

.transaction-icon.expense {
  background: #dc3545;
}

.transaction-icon svg {
  width: 20px;
  height: 20px;
}

.transaction-info {
  flex: 1;
}

.transaction-title {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
  margin-bottom: 2px;
}

.transaction-time {
  font-size: 12px;
  color: #6c757d;
}

.transaction-amount {
  font-size: 16px;
  font-weight: 600;
}

.transaction-amount.income {
  color: #28a745;
}

.transaction-amount.expense {
  color: #dc3545;
}

/* 账单视图样式 */
.bills-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.bills-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.back-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.bills-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #495057;
}

.month-select {
  padding: 6px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.bills-summary {
  display: flex;
  gap: 16px;
  padding: 20px;
}

.summary-item {
  flex: 1;
  background: white;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
}

.summary-label {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 8px;
}

.summary-amount {
  font-size: 20px;
  font-weight: 600;
}

.summary-amount.income {
  color: #28a745;
}

.summary-amount.expense {
  color: #dc3545;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #212529;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: #007bff;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn.secondary {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e9ecef;
}

.btn.secondary:hover {
  background: #e9ecef;
  color: #495057;
}

.btn.primary {
  background: #007bff;
  color: white;
}

.btn.primary:hover {
  background: #0056b3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .bills-summary {
    flex-direction: column;
    gap: 12px;
  }
}

/* 滚动条样式 */
.wallet-view::-webkit-scrollbar {
  width: 6px;
}

.wallet-view::-webkit-scrollbar-track {
  background: transparent;
}

.wallet-view::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 3px;
}

.wallet-view::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}
</style>
