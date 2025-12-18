import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GenerationState {
  isGenerating: boolean;
  isCompleted: boolean;
  startTime: number;
  prompt: string;
  referenceImages: string[];
  aspectRatio: string;
  imageCount: number;
  uid: string;
  streamEnabled: boolean;
  responseFormat: 'url' | 'base64';
}

export interface GenerationProgress {
  state: GenerationState;
  elapsed: number;
}

const GENERATION_STATE_KEY = 'poster_generation_state';

class GenerationStateService {
  /**
   * 保存生成状态
   */
  async saveGenerationState(state: GenerationState): Promise<void> {
    try {
      await AsyncStorage.setItem(GENERATION_STATE_KEY, JSON.stringify(state));
      // 只在必要时输出日志
    } catch (error) {
      console.error('[GenerationStateService] 保存生成状态失败:', error);
    }
  }

  /**
   * 获取生成状态
   */
  async getGenerationState(): Promise<GenerationState | null> {
    try {
      const stateData = await AsyncStorage.getItem(GENERATION_STATE_KEY);
      if (stateData) {
        const state = JSON.parse(stateData) as GenerationState;
        return state;
      }
      return null;
    } catch (error) {
      console.error('[GenerationStateService] 获取生成状态失败:', error);
      return null;
    }
  }

  /**
   * 清除生成状态
   */
  async clearGenerationState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GENERATION_STATE_KEY);
      // 只在必要时输出日志
    } catch (error) {
      console.error('[GenerationStateService] 清除生成状态失败:', error);
    }
  }

  /**
   * 开始生成，保存初始状态
   */
  async startGeneration(params: {
    prompt: string;
    referenceImages: string[];
    aspectRatio: string;
    imageCount: number;
    uid: string;
    streamEnabled: boolean;
    responseFormat: 'url' | 'base64';
  }): Promise<void> {
    const state: GenerationState = {
      isGenerating: true,
      isCompleted: false,
      startTime: Date.now(),
      ...params
    };
    await this.saveGenerationState(state);
  }

  /**
   * 完成生成
   */
  async completeGeneration(): Promise<void> {
    const currentState = await this.getGenerationState();
    if (currentState && !currentState.isCompleted) { // 防止重复完成
      const completedState: GenerationState = {
        ...currentState,
        isGenerating: false,
        isCompleted: true
      };
      await this.saveGenerationState(completedState);
    }
  }

  /**
   * 获取生成进度信息
   */
  async getGenerationProgress(): Promise<GenerationProgress | null> {
    const state = await this.getGenerationState();
    if (state) {
      const elapsed = Date.now() - state.startTime;
      return {
        state,
        elapsed
      };
    }
    return null;
  }

  /**
   * 检查是否有正在进行的生成
   */
  async hasActiveGeneration(): Promise<boolean> {
    const state = await this.getGenerationState();
    return state ? state.isGenerating : false;
  }

  /**
   * 检查是否有已完成的生成
   */
  async hasCompletedGeneration(): Promise<boolean> {
    const state = await this.getGenerationState();
    return state ? state.isCompleted : false;
  }
}

export const generationStateService = new GenerationStateService();