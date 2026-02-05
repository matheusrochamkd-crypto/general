import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { SectionList } from './components/SectionList';
import { Header } from './components/Header';
import { QuoteBanner } from './components/QuoteBanner';
import { MissionStatusCard } from './components/MissionStatusCard';
import { RewardVault } from './components/RewardVault';
import { VehicleRoadmap } from './components/VehicleRoadmap';
import { RevenueTimeline } from './components/RevenueTimeline';
import { CommandCenter } from './components/CommandCenter';
import { BucketList } from './components/BucketList';
import { EventsAgenda } from './components/EventsAgenda';
import { CapitalSocialLoader } from './components/CapitalSocialLoader';
import { PageTransition } from './components/PageTransition'; // Import Transition
import { incomeProjections } from './data/incomeProjections'; // Import Projections
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient';
import { MonthData, TransactionItem } from './types';
import { Target, TrendingUp, CheckCircle2, Lock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState('feb');
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showRewardVault, setShowRewardVault] = useState(false);
  const [showVehicleRoadmap, setShowVehicleRoadmap] = useState(false);
  const [showRevenueTimeline, setShowRevenueTimeline] = useState(false);
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [showBucketList, setShowBucketList] = useState(false);
  const [showEventsAgenda, setShowEventsAgenda] = useState(true);
  const [showCapitalSocial, setShowCapitalSocial] = useState(false);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const months: MonthData[] = [
    { id: 'feb', name: 'Fevereiro', status: 'ACTV' },
    { id: 'mar', name: 'Março', status: 'PEND' },
    { id: 'apr', name: 'Abril', status: 'PEND' },
    { id: 'may', name: 'Maio', status: 'PEND' },
    { id: 'jun', name: 'Junho', status: 'PEND' },
    { id: 'jul', name: 'Julho', status: 'PEND' },
    { id: 'aug', name: 'Agosto', status: 'PEND' },
    { id: 'sep', name: 'Setembro', status: 'PEND' },
    { id: 'oct', name: 'Outubro', status: 'PEND' },
    { id: 'nov', name: 'Novembro', status: 'PEND' },
    { id: 'dec', name: 'Dezembro', status: 'PEND' },
  ];

  // Get current month data
  const currentMonthData = months.find(m => m.id === currentMonth) || months[0];

  // State for Lists
  const [targets, setTargets] = useState<TransactionItem[]>([]);
  const [fixedIncome, setFixedIncome] = useState<TransactionItem[]>([]);
  const [fixedCosts, setFixedCosts] = useState<TransactionItem[]>([]);
  const [variableCosts, setVariableCosts] = useState<TransactionItem[]>([]);

  // Load data from Supabase
  const loadTransactions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_id', currentMonth);

      if (error) throw error;

      // Separate by category
      const targetsData = data?.filter(t => t.category === 'TARGET').map(t => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        date: t.date,
        isRecurring: t.is_recurring,
        completed: t.completed || false
      })) || [];

      const incomeData = data?.filter(t => t.category === 'INCOME').map(t => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        date: t.date,
        isRecurring: t.is_recurring,
        completed: t.completed || false
      })) || [];

      const fixedCostData = data?.filter(t => t.category === 'FIXED_COST').map(t => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        date: t.date,
        isRecurring: t.is_recurring
      })) || [];

      const varCostData = data?.filter(t => t.category === 'VARIABLE_COST').map(t => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        date: t.date,
        isRecurring: t.is_recurring
      })) || [];

      setTargets(targetsData);
      setFixedIncome(incomeData);
      setFixedCosts(fixedCostData);
      setVariableCosts(varCostData);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentMonth]);

  // Load on mount and month change
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Generic add function
  const addTransaction = async (category: string, item: Omit<TransactionItem, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        month_id: currentMonth,
        category,
        description: item.description,
        amount: item.amount,
        date: item.date || null,
        is_recurring: item.isRecurring || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      return;
    }

    const newItem: TransactionItem = {
      id: data.id,
      description: data.description,
      amount: Number(data.amount),
      date: data.date,
      isRecurring: data.is_recurring
    };

    switch (category) {
      case 'TARGET':
        setTargets(prev => [...prev, newItem]);
        break;
      case 'INCOME':
        setFixedIncome(prev => [...prev, newItem]);
        break;
      case 'FIXED_COST':
        setFixedCosts(prev => [...prev, newItem]);
        break;
      case 'VARIABLE_COST':
        setVariableCosts(prev => [...prev, newItem]);
        break;
    }
  };

  // Generic remove function
  const removeTransaction = async (category: string, id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing transaction:', error);
      return;
    }

    switch (category) {
      case 'TARGET':
        setTargets(prev => prev.filter(i => i.id !== id));
        break;
      case 'INCOME':
        setFixedIncome(prev => prev.filter(i => i.id !== id));
        break;
      case 'FIXED_COST':
        setFixedCosts(prev => prev.filter(i => i.id !== id));
        break;
      case 'VARIABLE_COST':
        setVariableCosts(prev => prev.filter(i => i.id !== id));
        break;
    }
  };

  // Handlers
  const addTarget = (item: Omit<TransactionItem, 'id'>) => addTransaction('TARGET', item);
  const removeTarget = (id: string) => removeTransaction('TARGET', id);

  // Fixed Income with propagation to subsequent months
  const addIncome = async (item: Omit<TransactionItem, 'id'>) => {
    if (!user) return;

    const currentMonthIndex = months.findIndex(m => m.id === currentMonth);
    const subsequentMonths = months.slice(currentMonthIndex).map(m => m.id);

    const insertPromises = subsequentMonths.map(monthId =>
      supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          month_id: monthId,
          category: 'INCOME',
          description: item.description,
          amount: item.amount,
          date: item.date || null,
          is_recurring: true
        })
    );

    await Promise.all(insertPromises);
    loadTransactions();
  };

  const removeIncome = async (id: string) => {
    if (!user) return;

    const { data: itemToRemove, error: fetchError } = await supabase
      .from('transactions')
      .select('description, amount')
      .eq('id', id)
      .single();

    if (fetchError || !itemToRemove) {
      console.error('Error fetching transaction:', fetchError);
      return;
    }

    const currentMonthIndex = months.findIndex(m => m.id === currentMonth);
    const subsequentMonths = months.slice(currentMonthIndex).map(m => m.id);

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user.id)
      .eq('category', 'INCOME')
      .eq('description', itemToRemove.description)
      .eq('amount', itemToRemove.amount)
      .in('month_id', subsequentMonths);

    if (error) {
      console.error('Error removing fixed income:', error);
      return;
    }

    setFixedIncome(prev => prev.filter(i => i.id !== id));
  };

  // Fixed Cost with propagation to subsequent months
  const addFixedCost = async (item: Omit<TransactionItem, 'id'>) => {
    if (!user) return;

    // Get all months from current month onwards
    const currentMonthIndex = months.findIndex(m => m.id === currentMonth);
    const subsequentMonths = months.slice(currentMonthIndex).map(m => m.id);

    // Create a unique group_id to link related fixed costs
    const groupId = crypto.randomUUID();

    // Insert into all subsequent months
    const insertPromises = subsequentMonths.map(monthId =>
      supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          month_id: monthId,
          category: 'FIXED_COST',
          description: item.description,
          amount: item.amount,
          date: item.date || null,
          is_recurring: true
        })
    );

    await Promise.all(insertPromises);

    // Reload current month data
    loadTransactions();
  };

  const removeFixedCost = async (id: string) => {
    if (!user) return;

    // First, get the item details
    const { data: itemToRemove, error: fetchError } = await supabase
      .from('transactions')
      .select('description, amount')
      .eq('id', id)
      .single();

    if (fetchError || !itemToRemove) {
      console.error('Error fetching transaction:', fetchError);
      return;
    }

    // Get all months from current month onwards
    const currentMonthIndex = months.findIndex(m => m.id === currentMonth);
    const subsequentMonths = months.slice(currentMonthIndex).map(m => m.id);

    // Delete from all subsequent months where description and amount match
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user.id)
      .eq('category', 'FIXED_COST')
      .eq('description', itemToRemove.description)
      .eq('amount', itemToRemove.amount)
      .in('month_id', subsequentMonths);

    if (error) {
      console.error('Error removing fixed costs:', error);
      return;
    }

    // Update local state
    setFixedCosts(prev => prev.filter(i => i.id !== id));
  };

  const addVarCost = (item: Omit<TransactionItem, 'id'>) => addTransaction('VARIABLE_COST', item);
  const removeVarCost = (id: string) => removeTransaction('VARIABLE_COST', id);

  // Toggle complete for TARGET items
  const toggleTargetComplete = async (id: string, completed: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('transactions')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', id);

    if (error) {
      console.error('Error toggling complete:', error);
      return;
    }

    setTargets(prev => prev.map(item =>
      item.id === id ? { ...item, completed } : item
    ));
  };

  // Helper to check if income is received based on date
  // Only mark as received if: 1) we're in the same month (or past) AND current day >= item day
  const isIncomeReceived = (item: TransactionItem) => {
    if (item.completed) return true;
    if (!item.date) return false;

    const today = new Date();
    const currentMonthIndex = today.getMonth(); // 0 = Jan, 1 = Feb, etc.

    // Map month IDs to their index (feb = 1, mar = 2, etc.)
    const monthIndexMap: { [key: string]: number } = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };

    const viewingMonthIndex = monthIndexMap[currentMonth] ?? 1;

    // If viewing a future month, income is not received yet
    if (viewingMonthIndex > currentMonthIndex) {
      return false;
    }

    // If viewing a past month, all income is received
    if (viewingMonthIndex < currentMonthIndex) {
      return true;
    }

    // Same month: check if current day >= item day
    const currentDay = today.getDate();
    const itemDay = parseInt(item.date.split('/')[0] || item.date, 10);
    return currentDay >= itemDay;
  };

  // Calculations
  const totalTargets = targets.reduce((acc, item) => acc + item.amount, 0);
  const totalFixedIncome = fixedIncome.reduce((acc, item) => acc + item.amount, 0);
  const totalExpectation = totalTargets + totalFixedIncome;

  // Calculate realized: completed targets + received income
  const realizedFromTargets = targets.filter(t => t.completed).reduce((acc, item) => acc + item.amount, 0);
  const realizedFromIncome = fixedIncome.filter(isIncomeReceived).reduce((acc, item) => acc + item.amount, 0);
  const totalRealized = realizedFromTargets + realizedFromIncome;

  const totalFixedCost = fixedCosts.reduce((acc, item) => acc + item.amount, 0);
  const totalVariableCost = variableCosts.reduce((acc, item) => acc + item.amount, 0);
  const totalCost = totalFixedCost + totalVariableCost;

  // Calculate Income & Goals based on real data (NEW)
  const currentTotalIncome = fixedIncome.reduce((acc, curr) => acc + curr.amount, 0);

  // Get Monthly Goal from Projections (NEW)
  // Default fallback 3000 if not found
  const projection = incomeProjections.find(p => p.id === `${currentMonth}-2026`) ||
    incomeProjections.find(p => p.id === `${currentMonth}-2027`);
  const monthlyGoal = projection ? projection.total : 3000;

  const missionGap = (monthlyGoal || 0) - totalRealized;
  // Coverage is based on REALIZED money, not expected
  const coveragePercent = monthlyGoal > 0 ? Math.min(100, (totalRealized / monthlyGoal) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-dark flex items-center justify-center">
        <div className="text-accent-cyan text-lg font-medium animate-pulse">
          Carregando Dados...
        </div>
      </div>
    );
  }

  // Renderização principal com Transições (NEW)
  // Verifica se alguma página interna está aberta
  const isInternalPageOpen = showRewardVault || showVehicleRoadmap || showRevenueTimeline || showCommandCenter || showBucketList || showEventsAgenda || showCapitalSocial;

  return (
    <div className="min-h-screen text-text-primary relative overflow-hidden">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-[-2] bg-[url('/bg-comandos.jpg')] bg-cover bg-center bg-no-repeat"
        style={{ filter: 'brightness(0.3)' }}
      />
      {/* Gradient Overlay */}
      <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-black/80 via-black/70 to-black/90" />

      {/* Sidebar - Always Visible */}
      <Sidebar
        months={months}
        currentMonthId={currentMonth}
        onSelectMonth={(monthId) => {
          // Close all pages when selecting a month
          setShowRewardVault(false);
          setShowVehicleRoadmap(false);
          setShowRevenueTimeline(false);
          setShowCommandCenter(false);
          setShowBucketList(false);
          setShowEventsAgenda(false);
          setShowCapitalSocial(false);
          setCurrentMonth(monthId);
        }}
        onOpenRewardVault={() => {
          // Close other pages, open this one
          setShowVehicleRoadmap(false);
          setShowRevenueTimeline(false);
          setShowCommandCenter(false);
          setShowBucketList(false);
          setShowEventsAgenda(false);
          setShowCapitalSocial(false);
          setShowRewardVault(true);
        }}
        onOpenVehicleRoadmap={() => {
          // Close other pages, open this one
          setShowRewardVault(false);
          setShowRevenueTimeline(false);
          setShowCommandCenter(false);
          setShowBucketList(false);
          setShowEventsAgenda(false);
          setShowCapitalSocial(false);
          setShowVehicleRoadmap(true);
        }}
        onOpenRevenueTimeline={() => {
          // Close other pages, open this one
          setShowRewardVault(false);
          setShowVehicleRoadmap(false);
          setShowCommandCenter(false);
          setShowBucketList(false);
          setShowEventsAgenda(false);
          setShowCapitalSocial(false);
          setShowRevenueTimeline(true);
        }}
        onOpenCommandCenter={() => {
          // Close other pages, open this one
          setShowRewardVault(false);
          setShowVehicleRoadmap(false);
          setShowRevenueTimeline(false);
          setShowBucketList(false);
          setShowEventsAgenda(false);
          setShowCapitalSocial(false);
          setShowCommandCenter(true);
        }}
        onOpenBucketList={() => {
          // Close other pages, open this one
          setShowRewardVault(false);
          setShowVehicleRoadmap(false);
          setShowRevenueTimeline(false);
          setShowCommandCenter(false);
          setShowEventsAgenda(false);
          setShowCapitalSocial(false);
          setShowBucketList(true);
        }}
        onOpenEventsAgenda={() => {
          // Close other pages, open this one
          setShowRewardVault(false);
          setShowVehicleRoadmap(false);
          setShowRevenueTimeline(false);
          setShowCommandCenter(false);
          setShowBucketList(false);
          setShowCapitalSocial(false);
          setShowEventsAgenda(true);
        }}
        onOpenCapitalSocial={() => {
          // Close other pages, open this one
          setShowRewardVault(false);
          setShowVehicleRoadmap(false);
          setShowRevenueTimeline(false);
          setShowCommandCenter(false);
          setShowBucketList(false);
          setShowEventsAgenda(false);
          setShowCapitalSocial(true);
        }}
      />

      {/* Main Content Area */}
      <main className="ml-72 p-8 relative min-h-screen">
        {/* Internal Pages with Transitions */}
        <PageTransition isVisible={showRewardVault}>
          <RewardVault
            onBack={() => setShowRewardVault(false)}
            metaMensalCarro={monthlyGoal}
            valorGuardadoAtual={totalRealized}
          />
        </PageTransition>

        <PageTransition isVisible={showVehicleRoadmap}>
          <VehicleRoadmap
            currentMonthlyIncome={currentTotalIncome}
            onBack={() => setShowVehicleRoadmap(false)}
          />
        </PageTransition>

        <PageTransition isVisible={showRevenueTimeline}>
          <RevenueTimeline
            onBack={() => setShowRevenueTimeline(false)}
          />
        </PageTransition>

        <PageTransition isVisible={showCommandCenter}>
          <CommandCenter
            onBack={() => setShowCommandCenter(false)}
            monthName={currentMonthData.name}
            targets={targets}
            fixedIncome={fixedIncome}
            fixedCosts={fixedCosts}
            variableCosts={variableCosts}
            totalRealized={totalRealized}
            totalExpectation={totalExpectation}
            totalCost={totalCost}
            coveragePercent={coveragePercent}
            missionGap={missionGap}
          />
        </PageTransition>

        <PageTransition isVisible={showBucketList}>
          <BucketList
            onBack={() => setShowBucketList(false)}
          />
        </PageTransition>

        <PageTransition isVisible={showEventsAgenda}>
          <EventsAgenda
            onBack={() => setShowEventsAgenda(false)}
          />
        </PageTransition>

        <PageTransition isVisible={showCapitalSocial}>
          <CapitalSocialLoader />
        </PageTransition>

        {/* Dashboard Content - Hidden when internal page is open */}
        <div className={`transition-all duration-500 ease-in-out ${isInternalPageOpen ? 'opacity-0 scale-95 pointer-events-none hidden' : 'opacity-100 scale-100'}`}>
          <Header
            monthName={currentMonthData.name}
            year="2026"
            status={currentMonthData.status === 'ACTV' ? 'Em Simulação' : 'Pendente'}
            currentTime={time}
          />

          <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <QuoteBanner quote="Homem não dá desculpa. Homem só precisa fazer dinheiro." />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard
                title="Expectativa Total"
                value={totalExpectation}
                subtitle="Alvos + Fixo"
                icon={Target}
                color="yellow"
                onClick={() => setShowRevenueTimeline(true)}
              />

              <StatCard
                title="Dinheiro Fixo"
                value={totalFixedIncome}
                subtitle="Previsto Mês"
                icon={TrendingUp}
                color="blue"
              />

              <StatCard
                title="Central de Recompensas"
                value={totalRealized}
                subtitle={`Meta: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyGoal)}`}
                icon={CheckCircle2}
                color="green"
                onClick={() => setShowRewardVault(true)}
              />

              <StatCard
                title="Custo Operacional"
                value={totalCost}
                subtitle="Fixo + Variável"
                icon={Lock}
                color="red"
              />

              {/* Mission Status Widget */}
              <MissionStatusCard missionGap={missionGap} coveragePercent={coveragePercent} />
            </div>

            {/* Customer Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SectionList
                title="Alvos / Extras"
                type="TARGET"
                items={targets}
                total={targets.reduce((acc, i) => acc + i.amount, 0)}
                onAddItem={addTarget}
                onRemoveItem={removeTarget}
                onToggleComplete={toggleTargetComplete}
                colorTheme="yellow"
              />

              <SectionList
                title="Dinheiro Fixo / Previsto"
                type="INCOME"
                items={fixedIncome}
                total={totalFixedIncome}
                onAddItem={addIncome}
                onRemoveItem={removeIncome}
                colorTheme="blue"
                warningMessage="Receitas fixas são propagadas automaticamente para meses subsequentes."
                currentMonthId={currentMonth}
              />

              <SectionList
                title="Custos Fixos"
                type="FIXED_COST"
                items={fixedCosts}
                total={totalFixedCost}
                onAddItem={addFixedCost}
                onRemoveItem={removeFixedCost}
                colorTheme="red"
                warningMessage="Custos fixos são propagados automaticamente para meses subsequentes."
              />

              <SectionList
                title="Custos Variáveis"
                type="VARIABLE_COST"
                items={variableCosts}
                total={totalVariableCost}
                onAddItem={addVarCost}
                onRemoveItem={removeVarCost}
                colorTheme="red"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
};

export default App;