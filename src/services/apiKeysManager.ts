export interface ApiKeyInfo {
  key: string;
  maskedKey: string;
  queriesRemaining?: number;
  queriesUsed?: number;
  isExhausted?: boolean;
}

const STORAGE_KEYS_KEY = 'rxcheck_user_api_keys';
const STORAGE_ACTIVE_INDEX_KEY = 'rxcheck_active_key_index';

class ApiKeysManager {
  private keys: ApiKeyInfo[] = [];
  private activeIndex: number = 0;
  private listeners: Array<() => void> = [];

  constructor() {
    this.initKeys();
  }

  private mask(key: string): string {
    if (!key) return '';
    const clean = key.trim();
    if (clean.length <= 12) return '••••' + clean.slice(-4);
    return clean.slice(0, 8) + '••••' + clean.slice(-6);
  }

  private initKeys() {
    const rawKeys: string[] = [];

    // 1. Read from env multiple keys
    const envMulti = import.meta.env.VITE_RXCHECK_API_KEYS as string | undefined;
    if (envMulti) {
      envMulti.split(',').map(k => k.trim()).filter(Boolean).forEach(k => {
        if (!rawKeys.includes(k)) rawKeys.push(k);
      });
    }

    // 2. Read single env key
    const envSingle = import.meta.env.VITE_RXCHECK_API_KEY as string | undefined;
    if (envSingle && !rawKeys.includes(envSingle.trim())) {
      rawKeys.unshift(envSingle.trim());
    }

    // 3. Read custom user keys saved in localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        parsed.forEach(k => {
          if (!rawKeys.includes(k.trim())) rawKeys.push(k.trim());
        });
      }
    } catch {
      // Ignore storage errors
    }

    // Build key info list
    this.keys = rawKeys.map(key => ({
      key,
      maskedKey: this.mask(key),
      queriesRemaining: undefined,
      queriesUsed: undefined,
      isExhausted: false,
    }));

    // Restore active index
    try {
      const savedIndex = localStorage.getItem(STORAGE_ACTIVE_INDEX_KEY);
      if (savedIndex !== null) {
        const idx = parseInt(savedIndex, 10);
        if (idx >= 0 && idx < this.keys.length) {
          this.activeIndex = idx;
        }
      }
    } catch {
      this.activeIndex = 0;
    }
  }

  public getActiveKey(): string {
    if (this.keys.length === 0) return '';
    return this.keys[this.activeIndex]?.key || '';
  }

  public getActiveKeyInfo(): ApiKeyInfo | null {
    if (this.keys.length === 0) return null;
    return this.keys[this.activeIndex] || null;
  }

  public getAllKeys(): ApiKeyInfo[] {
    return [...this.keys];
  }

  public getActiveIndex(): number {
    return this.activeIndex;
  }

  public setActiveIndex(index: number) {
    if (index >= 0 && index < this.keys.length) {
      this.activeIndex = index;
      try {
        localStorage.setItem(STORAGE_ACTIVE_INDEX_KEY, index.toString());
      } catch {
        // Ignore
      }
      this.notify();
    }
  }

  public updateActiveKeyUsage(used?: number, remaining?: number) {
    const current = this.keys[this.activeIndex];
    if (current) {
      if (typeof used === 'number') current.queriesUsed = used;
      if (typeof remaining === 'number') {
        current.queriesRemaining = remaining;
        if (remaining <= 0) {
          current.isExhausted = true;
        }
      }
      this.notify();
    }
  }

  /**
   * Rotate to next available key if active key is exhausted or encounters 429
   * Returns true if a new key was selected, false if all keys are exhausted
   */
  public rotateToNextKey(): boolean {
    if (this.keys.length <= 1) return false;

    // Mark current as exhausted
    if (this.keys[this.activeIndex]) {
      this.keys[this.activeIndex].isExhausted = true;
    }

    // Find next unexhausted key
    for (let i = 0; i < this.keys.length; i++) {
      const candidateIndex = (this.activeIndex + 1 + i) % this.keys.length;
      if (!this.keys[candidateIndex].isExhausted) {
        this.activeIndex = candidateIndex;
        try {
          localStorage.setItem(STORAGE_ACTIVE_INDEX_KEY, this.activeIndex.toString());
        } catch {
          // Ignore
        }
        this.notify();
        return true;
      }
    }

    return false;
  }

  public addKey(newKey: string): boolean {
    const clean = newKey.trim();
    if (!clean || this.keys.some(k => k.key === clean)) return false;

    this.keys.push({
      key: clean,
      maskedKey: this.mask(clean),
      isExhausted: false,
    });

    try {
      const stored = this.keys.map(k => k.key);
      localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(stored));
    } catch {
      // Ignore
    }

    this.notify();
    return true;
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }
}

export const apiKeysManager = new ApiKeysManager();
