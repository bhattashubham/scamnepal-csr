const fs = require('fs');
const path = require('path');

class ForexService {
  constructor() {
    this.cacheFile = path.join(__dirname, '../cache/forex-rates.json');
    this.cache = null;
    this.lastUpdate = null;
    this.updateInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.apiUrl = 'https://api.exchangerate-api.com/v4/latest/USD';
    
    // Ensure cache directory exists
    this.ensureCacheDirectory();
    
    // Load existing cache
    this.loadCache();
  }

  ensureCacheDirectory() {
    const cacheDir = path.dirname(this.cacheFile);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
  }

  loadCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const cacheData = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
        this.cache = cacheData.rates;
        this.lastUpdate = new Date(cacheData.lastUpdate);
        console.log('📊 Forex rates loaded from cache:', this.lastUpdate.toISOString());
      }
    } catch (error) {
      console.error('Error loading forex cache:', error);
      this.cache = null;
    }
  }

  saveCache() {
    try {
      const cacheData = {
        rates: this.cache,
        lastUpdate: new Date().toISOString()
      };
      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
      console.log('💾 Forex rates saved to cache');
    } catch (error) {
      console.error('Error saving forex cache:', error);
    }
  }

  async fetchLatestRates() {
    try {
      console.log('🌐 Fetching latest forex rates from API...');
      const response = await fetch(this.apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract rates we need
      const rates = {
        USD: 1, // Base currency
        INR: data.rates.INR || 83.5,
        EUR: data.rates.EUR || 0.92, // EUR to USD, then we'll convert to INR
        NPR: data.rates.NPR || 0.0075 // NPR to USD, then we'll convert to INR
      };
      
      // Convert EUR and NPR to INR rates
      rates.EUR = rates.EUR * rates.INR; // EUR to INR
      rates.NPR = rates.NPR * rates.INR; // NPR to INR
      
      this.cache = rates;
      this.lastUpdate = new Date();
      this.saveCache();
      
      console.log('✅ Forex rates updated:', rates);
      return rates;
      
    } catch (error) {
      console.error('❌ Error fetching forex rates:', error);
      return this.getFallbackRates();
    }
  }

  getFallbackRates() {
    console.log('⚠️ Using fallback forex rates');
    return {
      USD: 1,
      INR: 83.5,
      EUR: 91.2,
      NPR: 0.62
    };
  }

  async getRates() {
    const now = new Date();
    
    // Check if we need to update
    if (!this.cache || !this.lastUpdate || 
        (now.getTime() - this.lastUpdate.getTime()) > this.updateInterval) {
      console.log('🔄 Forex rates cache expired, fetching new rates...');
      return await this.fetchLatestRates();
    }
    
    console.log('📊 Using cached forex rates');
    return this.cache;
  }

  async convertToINR(amount, fromCurrency) {
    const rates = await this.getRates();
    const currency = fromCurrency.toUpperCase();
    
    if (currency === 'INR') {
      return amount;
    }
    
    const rate = rates[currency];
    if (!rate) {
      console.warn(`⚠️ Unknown currency: ${currency}, using fallback rate`);
      return amount * this.getFallbackRates()[currency] || amount;
    }
    
    return amount * rate;
  }

  // Method to manually refresh rates (useful for testing)
  async refreshRates() {
    console.log('🔄 Manually refreshing forex rates...');
    return await this.fetchLatestRates();
  }

  // Get cache info for debugging
  getCacheInfo() {
    return {
      hasCache: !!this.cache,
      lastUpdate: this.lastUpdate,
      rates: this.cache,
      cacheAge: this.lastUpdate ? Date.now() - this.lastUpdate.getTime() : null
    };
  }
}

module.exports = new ForexService();
