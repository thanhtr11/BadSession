import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import FinanceOverall from './FinanceOverall';
import FinanceIncome from './FinanceIncome';
import FinanceExpense from './FinanceExpense';
import FinanceSetting from './FinanceSetting';
import PlayerIncomeSettings from './PlayerIncomeSettings';

export default function Finance({ user }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div>
      <h1 className="page-title">💰 Finance Management</h1>

      {/* Sub-navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '25px',
        borderBottom: '2px solid #ecf0f1',
        paddingBottom: '0'
      }}>
        <Link
          to="/finance/overall"
          style={{
            padding: '12px 20px',
            border: 'none',
            backgroundColor: isActive('/finance/overall') ? '#17a2b8' : 'transparent',
            color: isActive('/finance/overall') ? 'white' : '#7f8c8d',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: isActive('/finance/overall') ? 'bold' : 'normal',
            borderBottom: isActive('/finance/overall') ? '3px solid #17a2b8' : 'none',
            marginBottom: '-2px',
            transition: 'all 0.2s',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          📊 Overall
        </Link>
        <Link
          to="/finance/income"
          style={{
            padding: '12px 20px',
            border: 'none',
            backgroundColor: isActive('/finance/income') ? '#17a2b8' : 'transparent',
            color: isActive('/finance/income') ? 'white' : '#7f8c8d',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: isActive('/finance/income') ? 'bold' : 'normal',
            borderBottom: isActive('/finance/income') ? '3px solid #17a2b8' : 'none',
            marginBottom: '-2px',
            transition: 'all 0.2s',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          💸 Income
        </Link>
        <Link
          to="/finance/expense"
          style={{
            padding: '12px 20px',
            border: 'none',
            backgroundColor: isActive('/finance/expense') ? '#17a2b8' : 'transparent',
            color: isActive('/finance/expense') ? 'white' : '#7f8c8d',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: isActive('/finance/expense') ? 'bold' : 'normal',
            borderBottom: isActive('/finance/expense') ? '3px solid #17a2b8' : 'none',
            marginBottom: '-2px',
            transition: 'all 0.2s',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          💳 Expenses
        </Link>
        {user?.role === 'Admin' && (
          <>
            <Link
              to="/finance/setting"
              style={{
                padding: '12px 20px',
                border: 'none',
                backgroundColor: isActive('/finance/setting') ? '#17a2b8' : 'transparent',
                color: isActive('/finance/setting') ? 'white' : '#7f8c8d',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isActive('/finance/setting') ? 'bold' : 'normal',
                borderBottom: isActive('/finance/setting') ? '3px solid #17a2b8' : 'none',
                marginBottom: '-2px',
                transition: 'all 0.2s',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              🧑 Guest Income
            </Link>
            <Link
              to="/finance/player-income"
              style={{
                padding: '12px 20px',
                border: 'none',
                backgroundColor: isActive('/finance/player-income') ? '#17a2b8' : 'transparent',
                color: isActive('/finance/player-income') ? 'white' : '#7f8c8d',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isActive('/finance/player-income') ? 'bold' : 'normal',
                borderBottom: isActive('/finance/player-income') ? '3px solid #17a2b8' : 'none',
                marginBottom: '-2px',
                transition: 'all 0.2s',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              👥 Player Income
            </Link>
          </>
        )}
      </div>

      {/* Sub-page Content */}
      <Routes>
        <Route path="/overall" element={<FinanceOverall user={user} />} />
        <Route path="/income" element={<FinanceIncome user={user} />} />
        <Route path="/expense" element={<FinanceExpense user={user} />} />
        <Route path="/setting" element={<FinanceSetting user={user} />} />
        <Route path="/player-income" element={<PlayerIncomeSettings user={user} />} />
        {/* Default to overall */}
        <Route path="/" element={<FinanceOverall user={user} />} />
      </Routes>
    </div>
  );
}
