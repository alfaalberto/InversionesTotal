'use server';

import 'server-only';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

// Interfaces para todos los tipos de datos que vamos a persistir
export interface AnalysisReport {
  id?: string;
  userId?: string;
  timestamp: number;
  type: 'portfolio_analysis' | 'historical_analysis' | 'ai_insights';
  data: any;
  metadata: {
    portfolioValue: number;
    totalAssets: number;
    analysisVersion: string;
  };
}

export interface HistoricalData {
  id?: string;
  ticker: string;
  data: { date: string; price: number; volume?: number }[];
  lastUpdated: number;
  source: string;
}

export interface ExchangeRateData {
  id?: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: number;
  source: string;
  historicalData?: { date: string; rate: number }[];
}

export interface UserPreferences {
  id?: string;
  userId?: string;
  theme: 'light' | 'dark' | 'system';
  defaultCurrency: 'USD' | 'MXN';
  notifications: boolean;
  autoSave: boolean;
  lastSyncTimestamp: number;
}

export interface PortfolioSnapshot {
  id?: string;
  timestamp: number;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  assetCount: number;
  topPerformer: string;
  worstPerformer: string;
  exchangeRate: number;
}

// Referencias a las colecciones
const analysisReportsRef = collection(db, 'analysis_reports');
const historicalDataRef = collection(db, 'historical_data');
const exchangeRateRef = collection(db, 'exchange_rates');
const userPreferencesRef = collection(db, 'user_preferences');
const portfolioSnapshotsRef = collection(db, 'portfolio_snapshots');

// ============= ANÁLISIS REPORTS =============
export async function saveAnalysisReport(report: Omit<AnalysisReport, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(analysisReportsRef, {
      ...report,
      timestamp: Date.now()
    });
    console.log('✅ Analysis report saved:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving analysis report:', error);
    throw error;
  }
}

export async function getLatestAnalysisReport(type?: string): Promise<AnalysisReport | null> {
  try {
    let q = query(analysisReportsRef, orderBy('timestamp', 'desc'), limit(1));
    
    if (type) {
      q = query(analysisReportsRef, where('type', '==', type), orderBy('timestamp', 'desc'), limit(1));
    }
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as AnalysisReport;
  } catch (error) {
    console.error('❌ Error getting latest analysis report:', error);
    return null;
  }
}

export async function getAllAnalysisReports(type?: string): Promise<AnalysisReport[]> {
  try {
    let q = query(analysisReportsRef, orderBy('timestamp', 'desc'));
    
    if (type) {
      q = query(analysisReportsRef, where('type', '==', type), orderBy('timestamp', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalysisReport));
  } catch (error) {
    console.error('❌ Error getting analysis reports:', error);
    return [];
  }
}

// ============= DATOS HISTÓRICOS =============
export async function saveHistoricalData(data: Omit<HistoricalData, 'id'>): Promise<string> {
  try {
    // Usar ticker como ID para evitar duplicados
    const docRef = doc(historicalDataRef, data.ticker);
    await setDoc(docRef, {
      ...data,
      lastUpdated: Date.now()
    }, { merge: true });
    
    console.log('✅ Historical data saved for:', data.ticker);
    return data.ticker;
  } catch (error) {
    console.error('❌ Error saving historical data:', error);
    throw error;
  }
}

export async function getHistoricalData(ticker: string): Promise<HistoricalData | null> {
  try {
    const docRef = doc(historicalDataRef, ticker);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return { id: docSnap.id, ...docSnap.data() } as HistoricalData;
  } catch (error) {
    console.error('❌ Error getting historical data:', error);
    return null;
  }
}

export async function getAllHistoricalData(): Promise<HistoricalData[]> {
  try {
    const snapshot = await getDocs(historicalDataRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoricalData));
  } catch (error) {
    console.error('❌ Error getting all historical data:', error);
    return [];
  }
}

// ============= TIPOS DE CAMBIO =============
export async function saveExchangeRate(data: Omit<ExchangeRateData, 'id'>): Promise<string> {
  try {
    const pairId = `${data.fromCurrency}_${data.toCurrency}`;
    const docRef = doc(exchangeRateRef, pairId);
    
    await setDoc(docRef, {
      ...data,
      timestamp: Date.now()
    }, { merge: true });
    
    console.log('✅ Exchange rate saved:', pairId);
    return pairId;
  } catch (error) {
    console.error('❌ Error saving exchange rate:', error);
    throw error;
  }
}

export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRateData | null> {
  try {
    const pairId = `${fromCurrency}_${toCurrency}`;
    const docRef = doc(exchangeRateRef, pairId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return { id: docSnap.id, ...docSnap.data() } as ExchangeRateData;
  } catch (error) {
    console.error('❌ Error getting exchange rate:', error);
    return null;
  }
}

// ============= PREFERENCIAS DE USUARIO =============
export async function saveUserPreferences(preferences: Omit<UserPreferences, 'id'>): Promise<string> {
  try {
    const userId = preferences.userId || 'default_user';
    const docRef = doc(userPreferencesRef, userId);
    
    await setDoc(docRef, {
      ...preferences,
      lastSyncTimestamp: Date.now()
    }, { merge: true });
    
    console.log('✅ User preferences saved:', userId);
    return userId;
  } catch (error) {
    console.error('❌ Error saving user preferences:', error);
    throw error;
  }
}

export async function getUserPreferences(userId: string = 'default_user'): Promise<UserPreferences | null> {
  try {
    const docRef = doc(userPreferencesRef, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Crear preferencias por defecto
      const defaultPrefs: Omit<UserPreferences, 'id'> = {
        userId,
        theme: 'system',
        defaultCurrency: 'USD',
        notifications: true,
        autoSave: true,
        lastSyncTimestamp: Date.now()
      };
      await saveUserPreferences(defaultPrefs);
      return { id: userId, ...defaultPrefs };
    }
    
    return { id: docSnap.id, ...docSnap.data() } as UserPreferences;
  } catch (error) {
    console.error('❌ Error getting user preferences:', error);
    return null;
  }
}

// ============= SNAPSHOTS DEL PORTAFOLIO =============
export async function savePortfolioSnapshot(snapshot: Omit<PortfolioSnapshot, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(portfolioSnapshotsRef, {
      ...snapshot,
      timestamp: Date.now()
    });
    
    console.log('✅ Portfolio snapshot saved:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving portfolio snapshot:', error);
    throw error;
  }
}

export async function getLatestPortfolioSnapshot(): Promise<PortfolioSnapshot | null> {
  try {
    const q = query(portfolioSnapshotsRef, orderBy('timestamp', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as PortfolioSnapshot;
  } catch (error) {
    console.error('❌ Error getting latest portfolio snapshot:', error);
    return null;
  }
}

export async function getPortfolioSnapshots(limitCount: number = 30): Promise<PortfolioSnapshot[]> {
  try {
    const q = query(portfolioSnapshotsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioSnapshot));
  } catch (error) {
    console.error('❌ Error getting portfolio snapshots:', error);
    return [];
  }
}

// ============= FUNCIONES DE SINCRONIZACIÓN COMPLETA =============
export async function saveCompleteAppState(appState: {
  portfolio: any[];
  analysisReports: AnalysisReport[];
  historicalData: HistoricalData[];
  exchangeRates: ExchangeRateData[];
  userPreferences: UserPreferences;
  portfolioSnapshot: PortfolioSnapshot;
}): Promise<void> {
  try {
    console.log('🔄 Starting complete app state save...');
    
    const batch = writeBatch(db);
    let operationCount = 0;
    
    // Guardar análisis reports
    for (const report of appState.analysisReports) {
      if (operationCount >= 500) {
        await batch.commit();
        operationCount = 0;
      }
      const docRef = doc(analysisReportsRef);
      batch.set(docRef, report);
      operationCount++;
    }
    
    // Guardar datos históricos
    for (const data of appState.historicalData) {
      if (operationCount >= 500) {
        await batch.commit();
        operationCount = 0;
      }
      const docRef = doc(historicalDataRef, data.ticker);
      batch.set(docRef, data);
      operationCount++;
    }
    
    // Guardar tipos de cambio
    for (const rate of appState.exchangeRates) {
      if (operationCount >= 500) {
        await batch.commit();
        operationCount = 0;
      }
      const pairId = `${rate.fromCurrency}_${rate.toCurrency}`;
      const docRef = doc(exchangeRateRef, pairId);
      batch.set(docRef, rate);
      operationCount++;
    }
    
    // Guardar preferencias
    if (operationCount >= 500) {
      await batch.commit();
      operationCount = 0;
    }
    const prefsDocRef = doc(userPreferencesRef, appState.userPreferences.userId || 'default_user');
    batch.set(prefsDocRef, appState.userPreferences);
    operationCount++;
    
    // Guardar snapshot del portafolio
    if (operationCount >= 500) {
      await batch.commit();
      operationCount = 0;
    }
    const snapshotDocRef = doc(portfolioSnapshotsRef);
    batch.set(snapshotDocRef, appState.portfolioSnapshot);
    operationCount++;
    
    // Commit final
    if (operationCount > 0) {
      await batch.commit();
    }
    
    console.log('✅ Complete app state saved successfully!');
  } catch (error) {
    console.error('❌ Error saving complete app state:', error);
    throw error;
  }
}

export async function loadCompleteAppState(): Promise<{
  analysisReports: AnalysisReport[];
  historicalData: HistoricalData[];
  exchangeRates: ExchangeRateData[];
  userPreferences: UserPreferences | null;
  portfolioSnapshots: PortfolioSnapshot[];
}> {
  try {
    console.log('🔄 Loading complete app state...');
    
    const [
      analysisReports,
      historicalData,
      exchangeRates,
      userPreferences,
      portfolioSnapshots
    ] = await Promise.all([
      getAllAnalysisReports(),
      getAllHistoricalData(),
      getDocs(exchangeRateRef).then(snapshot => 
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExchangeRateData))
      ),
      getUserPreferences(),
      getPortfolioSnapshots(10)
    ]);
    
    console.log('✅ Complete app state loaded successfully!');
    console.log(`📊 Loaded: ${analysisReports.length} analysis reports, ${historicalData.length} historical data, ${exchangeRates.length} exchange rates, ${portfolioSnapshots.length} snapshots`);
    
    return {
      analysisReports,
      historicalData,
      exchangeRates,
      userPreferences,
      portfolioSnapshots
    };
  } catch (error) {
    console.error('❌ Error loading complete app state:', error);
    return {
      analysisReports: [],
      historicalData: [],
      exchangeRates: [],
      userPreferences: null,
      portfolioSnapshots: []
    };
  }
}

// ============= FUNCIÓN DE LIMPIEZA (OPCIONAL) =============
export async function cleanupOldData(daysToKeep: number = 30): Promise<void> {
  try {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    // Limpiar análisis reports antiguos
    const oldAnalysisQuery = query(
      analysisReportsRef, 
      where('timestamp', '<', cutoffTime)
    );
    const oldAnalysisSnapshot = await getDocs(oldAnalysisQuery);
    
    const batch = writeBatch(db);
    let operationCount = 0;
    
    oldAnalysisSnapshot.docs.forEach(doc => {
      if (operationCount < 500) {
        batch.delete(doc.ref);
        operationCount++;
      }
    });
    
    // Limpiar snapshots antiguos
    const oldSnapshotsQuery = query(
      portfolioSnapshotsRef, 
      where('timestamp', '<', cutoffTime)
    );
    const oldSnapshotsSnapshot = await getDocs(oldSnapshotsQuery);
    
    oldSnapshotsSnapshot.docs.forEach(doc => {
      if (operationCount < 500) {
        batch.delete(doc.ref);
        operationCount++;
      }
    });
    
    if (operationCount > 0) {
      await batch.commit();
      console.log(`✅ Cleaned up ${operationCount} old records`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up old data:', error);
  }
}
