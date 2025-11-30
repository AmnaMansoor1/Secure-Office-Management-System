import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Form, Button, Badge } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { getIncomes } from '../redux/slices/incomeSlice';
import { getExpenses } from '../redux/slices/expenseSlice';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const Analytics = () => {
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterPeriod, setFilterPeriod] = useState('monthly');
  
  const dispatch = useDispatch();
  const { incomes, isLoading: incomesLoading } = useSelector((state) => state.income);
  const { expenses, isLoading: expensesLoading } = useSelector((state) => state.expenses);
  const { user } = useSelector((state) => state.auth);
  const canViewAnalytics = user?.role === 'admin' || user?.permissions?.analytics?.view;
  
  useEffect(() => {
    dispatch(getIncomes());
    dispatch(getExpenses());
  }, [dispatch]);
  
  // Generate years for filter (last 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  
  const isLoading = incomesLoading || expensesLoading;
  
  // Process data for charts
  const processMonthlyData = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthlyData = months.map((month, index) => {
      // Get monthly income
      const monthlyIncome = incomes.filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate.getFullYear() === parseInt(filterYear) && incomeDate.getMonth() === index;
      }).reduce((sum, income) => sum + income.amount, 0);
      
      // Get monthly expense
      const monthlyExpense = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === parseInt(filterYear) && expenseDate.getMonth() === index;
      }).reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        name: month.substring(0, 3),
        income: monthlyIncome,
        expense: monthlyExpense,
        profit: monthlyIncome - monthlyExpense
      };
    });
    
    return monthlyData;
  };
  
  const processQuarterlyData = () => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    const quarterlyData = quarters.map((quarter, index) => {
      const startMonth = index * 3;
      const endMonth = startMonth + 2;
      
      // Get quarterly income
      const quarterlyIncome = incomes.filter(income => {
        const incomeDate = new Date(income.date);
        const month = incomeDate.getMonth();
        return incomeDate.getFullYear() === parseInt(filterYear) && 
          month >= startMonth && month <= endMonth;
      }).reduce((sum, income) => sum + income.amount, 0);
      
      // Get quarterly expense
      const quarterlyExpense = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const month = expenseDate.getMonth();
        return expenseDate.getFullYear() === parseInt(filterYear) && 
          month >= startMonth && month <= endMonth;
      }).reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        name: quarter,
        income: quarterlyIncome,
        expense: quarterlyExpense,
        profit: quarterlyIncome - quarterlyExpense
      };
    });
    
    return quarterlyData;
  };
  
  const processYearlyData = () => {
    // Get yearly income
    const yearlyIncome = incomes.filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate.getFullYear() === parseInt(filterYear);
    }).reduce((sum, income) => sum + income.amount, 0);
    
    // Get yearly expense
    const yearlyExpense = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === parseInt(filterYear);
    }).reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      income: yearlyIncome,
      expense: yearlyExpense,
      profit: yearlyIncome - yearlyExpense
    };
  };
  
  const processCategoryData = () => {
    // Get expense categories
    const expenseCategories = [...new Set(expenses.map(expense => expense.category))];
    
    const expenseCategoryData = expenseCategories.map(category => {
      const categoryExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expense.category === category && expenseDate.getFullYear() === parseInt(filterYear);
      }).reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        name: category,
        value: categoryExpenses
      };
    }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);
    
    // Get income categories
    const incomeCategories = [...new Set(incomes.map(income => income.category))];
    
    const incomeCategoryData = incomeCategories.map(category => {
      const categoryIncomes = incomes.filter(income => {
        const incomeDate = new Date(income.date);
        return income.category === category && incomeDate.getFullYear() === parseInt(filterYear);
      }).reduce((sum, income) => sum + income.amount, 0);
      
      return {
        name: category,
        value: categoryIncomes
      };
    }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);
    
    return {
      expenses: expenseCategoryData,
      incomes: incomeCategoryData
    };
  };
  
  const monthlyData = processMonthlyData();
  const quarterlyData = processQuarterlyData();
  const yearlyData = processYearlyData();
  const categoryData = processCategoryData();
  
  // Chart data based on selected period
  const chartData = filterPeriod === 'monthly' ? monthlyData : 
                    filterPeriod === 'quarterly' ? quarterlyData : 
                    [{ name: filterYear, ...yearlyData }];
  
  // Colors for the pie charts
  const EXPENSE_COLORS = ['#ff8042', '#ff5252', '#f44336', '#d32f2f', '#b71c1c', '#ffcdd2', '#ef5350', '#e57373', '#ef9a9a'];
  const INCOME_COLORS = ['#00C49F', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9', '#0088FE', '#2196F3', '#64B5F6', '#90CAF9'];
  
  if (!canViewAnalytics) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <h2>No Access</h2>
        <p className="text-muted mb-3">You do not have permission to view this page.</p>
        <a href="/profile" className="btn btn-primary">Go to My Profile</a>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  
  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>Financial Analytics</h1>
            <div className="d-flex gap-3">
              <Form.Group>
                <Form.Select 
                  value={filterPeriod} 
                  onChange={(e) => setFilterPeriod(e.target.value)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Select 
                  value={filterYear} 
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col lg={4} md={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Total Income</h5>
            </Card.Header>
            <Card.Body className="d-flex align-items-center justify-content-center">
              <h1 className="text-success">PKR{yearlyData.income.toLocaleString()}</h1>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} md={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">Total Expenses</h5>
            </Card.Header>
            <Card.Body className="d-flex align-items-center justify-content-center">
              <h1 className="text-danger">PKR{yearlyData.expense.toLocaleString()}</h1>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} md={12} className="mb-4">
          <Card className="h-100">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Net Profit</h5>
            </Card.Header>
            <Card.Body className="d-flex align-items-center justify-content-center">
              <h1 className={yearlyData.profit >= 0 ? 'text-success' : 'text-danger'}>
                PKR{yearlyData.profit.toLocaleString()}
              </h1>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col lg={12}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Income vs Expenses ({filterPeriod === 'monthly' ? 'Monthly' : filterPeriod === 'quarterly' ? 'Quarterly' : 'Yearly'})</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`PKR${value.toLocaleString()}`, null]}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#4CAF50" />
                  <Bar dataKey="expense" name="Expenses" fill="#F44336" />
                  <Bar dataKey="profit" name="Profit/Loss" fill="#2196F3" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">Expenses by Category</h5>
            </Card.Header>
            <Card.Body>
              {categoryData.expenses.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData.expenses}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.expenses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`PKR${value.toLocaleString()}`, null]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center my-5">No expense data available for the selected period.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Income by Category</h5>
            </Card.Header>
            <Card.Body>
              {categoryData.incomes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData.incomes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.incomes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`PKR${value.toLocaleString()}`, null]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center my-5">No income data available for the selected period.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col lg={12} className="mb-4">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Monthly Trend</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={monthlyData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`PKR${value.toLocaleString()}`, null]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="Income" stroke="#4CAF50" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="expense" name="Expenses" stroke="#F44336" />
                  <Line type="monotone" dataKey="profit" name="Profit/Loss" stroke="#2196F3" />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Analytics;