import { Recipe } from "@/services/api";
import { atom } from "jotai";
import { createStore } from "jotai/vanilla";

export type Chain = {
  recipe: Recipe;
  currentStep: number;
  estimatedTime: number;
  endTime?: number;
  isCurrent: boolean;
};

export const DEFAULT_TIME_ESTIMATE = 3;

export const walkthroughStore = createStore();
export const walkthroughChainAtom = atom<Chain[]>([]);
export const clockAtom = atom(Math.floor(Date.now() / 1000));

function estimateTime(recipe: Recipe) {
  return recipe.steps.reduce(
    (acc, step) => acc + (step.time ?? DEFAULT_TIME_ESTIMATE),
    0,
  );
}

function newChain(recipe: Recipe): Chain {
  return {
    recipe,
    currentStep: 0,
    estimatedTime: estimateTime(recipe),
    isCurrent: false,
  };
}

export function findLongestAvailableChainIdx(chains: Chain[]) {
  const [idx] = chains.reduce(
    (acc, chain, i) => {
      const isWaitingOnTimer = chain.endTime !== undefined;
      const isFinished = chain.currentStep >= chain.recipe.steps.length;
      if (isWaitingOnTimer || isFinished) {
        return acc;
      }
      if (acc[1] < chain.estimatedTime) {
        return [i, chain.estimatedTime];
      }
      return acc;
    },
    [-1, -1],
  );
  return idx;
}

export function findSoonestTimerChainIdx(chains: Chain[]) {
  const [idx] = chains.reduce(
    (acc, chain, i) => {
      if (chain.endTime === undefined) {
        return acc;
      }
      if (acc[1] === undefined || chain.endTime < acc[1]) {
        return [i, chain.endTime];
      }
      return acc;
    },
    [-1, undefined] as [number, number | undefined],
  );
  return idx;
}

export function setupWalkthrough(recipes: Recipe[]) {
  const chains = recipes.map(newChain);
  const idx = findLongestAvailableChainIdx(chains);
  if (idx >= 0) {
    chains[idx] = { ...chains[idx], isCurrent: true };
  }
  walkthroughStore.set(walkthroughChainAtom, chains);
}
