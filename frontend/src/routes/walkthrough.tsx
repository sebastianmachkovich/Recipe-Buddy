import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { validateAuth } from "@/services/api";
import type { Chain } from "@/state/walkthrough";
import {
  clockAtom,
  DEFAULT_TIME_ESTIMATE,
  findLongestAvailableChainIdx,
  findSoonestTimerChainIdx,
  walkthroughChainAtom,
} from "@/state/walkthrough";
import { useUpdateRecipe } from "@/hooks/queries";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtom, useAtomValue, useSetAtom, useStore } from "jotai";
import { useEffect, useId } from "react";

function useClockTick() {
  const setClock = useSetAtom(clockAtom);
  useEffect(() => {
    setClock(Math.floor(Date.now() / 1000));
    const interval = window.setInterval(() => {
      setClock(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [setClock]);
}

function useAdvance() {
  const [chains, setChains] = useAtom(walkthroughChainAtom);
  const store = useStore();

  const advance = () => {
    const idx = chains.findIndex((it) => it.isCurrent);
    const currentChain = chains[idx];
    const currentStep = currentChain.recipe.steps[currentChain.currentStep];

    const timeRemaining = currentChain.endTime
      ? Math.max(0, currentChain.endTime - store.get(clockAtom))
      : undefined;
    if (currentChain.endTime && timeRemaining === 0) {
      if (currentStep.type !== "blocking") {
        setChains((prev) =>
          prev.with(idx, {
            ...prev[idx],
            endTime: undefined,
          }),
        );
        return;
      }
    }

    if (currentStep.type === "background") {
      setChains((prev) => {
        const stepTime = currentStep.time ?? DEFAULT_TIME_ESTIMATE;
        const updated = prev.with(idx, {
          ...prev[idx],
          currentStep: prev[idx].currentStep + 1,
          estimatedTime: prev[idx].estimatedTime - stepTime,
          endTime: store.get(clockAtom) + stepTime * 60,
          isCurrent: false,
        });
        const nextIdx = findLongestAvailableChainIdx(updated);
        const fallbackIdx =
          nextIdx >= 0 ? nextIdx : findSoonestTimerChainIdx(updated);
        if (fallbackIdx < 0) {
          return updated;
        }
        return updated.with(fallbackIdx, {
          ...updated[fallbackIdx],
          isCurrent: true,
        });
      });
    } else if (currentStep.type === "blocking") {
      if (!currentChain.endTime) {
        setChains((prev) =>
          prev.with(idx, {
            ...currentChain,
            endTime:
              store.get(clockAtom) +
              (currentStep.time ?? DEFAULT_TIME_ESTIMATE) * 60,
          }),
        );
        return;
      }
      setChains((prev) =>
        prev.with(idx, {
          ...currentChain,
          endTime: undefined,
          estimatedTime:
            currentChain.estimatedTime -
            (currentStep.time ?? DEFAULT_TIME_ESTIMATE),
          currentStep: currentChain.currentStep + 1,
        }),
      );
    } else if (currentStep.type === "untimed") {
      setChains((prev) =>
        prev.with(idx, {
          ...currentChain,
          currentStep: currentChain.currentStep + 1,
          estimatedTime:
            currentChain.estimatedTime -
            (currentStep.time! ?? DEFAULT_TIME_ESTIMATE),
        }),
      );
    } else {
      throw new Error("Unknown step type:", currentStep.type);
    }
  };
  return advance;
}

function useTimeRemaining(chain?: Chain) {
  const now = useAtomValue(clockAtom);
  if (!chain?.endTime) return undefined;
  return Math.max(0, chain.endTime - now);
}

function formatTime(time: number) {
  const h = Math.floor(time / 3600);
  const m = Math.floor((time % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (time % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function WalkthroughPage() {
  useClockTick();
  return (
    <div className="w-full h-screen">
      <SidebarInset className="w-full">
        <div className="flex overflow-hidden select-none">
          <div className="flex flex-1 flex-row overflow-scroll scrollbar-hidden">
            <InstructionColumn />
            <TimerColumn />
          </div>
          <RecipeStepSidebar />
        </div>
      </SidebarInset>
    </div>
  );
}

function InstructionColumn() {
  const chains = useAtomValue(walkthroughChainAtom);
  const setChains = useSetAtom(walkthroughChainAtom);
  const { updateRecipe } = useUpdateRecipe();
  const navigate = useNavigate();
  const currentChain = chains.find((it) => it.isCurrent);
  const timeRemaining = useTimeRemaining(currentChain);
  const step = currentChain?.recipe.steps[currentChain.currentStep];
  const canGoBack = Boolean(currentChain && currentChain.currentStep > 0);
  const isLastStep =
    currentChain &&
    currentChain.currentStep === currentChain.recipe.steps.length - 1;
  const hasRemainingChains = currentChain
    ? chains.some(
        (it) =>
          it.recipe.id !== currentChain.recipe.id &&
          it.currentStep < it.recipe.steps.length,
      )
    : false;
  const isFinalWalkthroughStep = Boolean(isLastStep && !hasRemainingChains);
  const mayNotAdvance = (timeRemaining ?? 0) > 0;
  const advance = useAdvance();

  const handleComplete = () => {
    if (!currentChain) return;
    updateRecipe({ ...currentChain.recipe, inPlan: false });
    setChains([]);
    void navigate({ to: "/home" });
  };

  const handleBack = () => {
    if (!currentChain || currentChain.currentStep <= 0) return;
    const previousStep =
      currentChain.recipe.steps[currentChain.currentStep - 1];
    const previousStepTime = previousStep.time ?? DEFAULT_TIME_ESTIMATE;
    setChains((prev) => {
      const idx = prev.findIndex(
        (it) => it.recipe.id === currentChain.recipe.id,
      );
      if (idx < 0) return prev;
      return prev.with(idx, {
        ...prev[idx],
        currentStep: prev[idx].currentStep - 1,
        estimatedTime: prev[idx].estimatedTime + previousStepTime,
        endTime: undefined,
      });
    });
  };
  return (
    <div className="w-full p-16 flex flex-col gap-4 items-center overflow-hidden">
      <h1 className="h-full text-7xl">{step?.description}</h1>
      <div className="h-full text-9xl text-center flex flex-col items-center justify-center">
        {timeRemaining && formatTime(timeRemaining)}
      </div>
      <div className="w-3/4 flex gap-4">
        <Button
          variant="outline"
          size="lg"
          className="h-16 text-3xl cursor-pointer flex-1"
          disabled={!canGoBack}
          onClick={handleBack}
        >
          Back
        </Button>
        {isFinalWalkthroughStep ? (
          <Button
            variant="default"
            size="lg"
            className="h-16 text-3xl cursor-pointer flex-[2]"
            disabled={mayNotAdvance}
            onClick={handleComplete}
          >
            Complete
          </Button>
        ) : (
          <Button
            variant="default"
            size="lg"
            className="h-16 text-3xl cursor-pointer flex-[2]"
            disabled={mayNotAdvance}
            onClick={() => advance()}
          >
            Move on!
          </Button>
        )}
      </div>
    </div>
  );
}

function TimerColumn() {
  const chains = useAtomValue(walkthroughChainAtom);
  return (
    <div
      className="w-48 p-2 border-l-2 flex flex-col-reverse gap-4
                 overflow-scroll scrollbar-hidden"
    >
      {chains
        .filter((it) => !!it.endTime)
        .map((it) => (
          <Timer key={it.recipe.id} chain={it} />
        ))}
    </div>
  );
}

function Timer({ chain }: { chain: Chain }) {
  const timeRemaining = useTimeRemaining(chain);
  const [, setChains] = useAtom(walkthroughChainAtom);
  if (timeRemaining === undefined) return undefined;

  const isExpired = timeRemaining <= 0;
  const canDismiss = isExpired && !chain.isCurrent;

  function dismissTimer() {
    if (!canDismiss) return;

    setChains((prev) => {
      const idx = prev.findIndex((it) => it.recipe.id === chain.recipe.id);
      if (idx < 0) return prev;

      const updated = prev.with(idx, {
        ...prev[idx],
        endTime: undefined,
      });

      if (updated.some((it) => it.isCurrent)) {
        return updated;
      }

      const nextIdx = findLongestAvailableChainIdx(updated);
      if (nextIdx < 0) {
        return updated;
      }

      return updated.with(nextIdx, {
        ...updated[nextIdx],
        isCurrent: true,
      });
    });
  }

  return (
    <div
      className={cn(
        "aspect-square w-full border-4 rounded-2xl flex flex-col gap-4 items-center justify-center overflow-hidden",
        isExpired && "border-destructive text-destructive",
        canDismiss && "cursor-pointer hover:bg-destructive/10",
      )}
      onClick={dismissTimer}
    >
      <div className="text-center text-xl">{chain.recipe.name}</div>
      <div className="text-center text-3xl">{formatTime(timeRemaining)}</div>
    </div>
  );
}

function RecipeStepSidebar() {
  const chains = useAtomValue(walkthroughChainAtom);
  return (
    <SidebarProvider
      defaultOpen={true}
      className="w-md overflow-hidden max-h-dvh"
    >
      <Sidebar
        collapsible="icon"
        variant="sidebar"
        side="right"
        className="group w-md"
      >
        <SidebarContent className="flex flex-col gap-2">
          <SidebarGroup>
            <SidebarMenu>
              {chains.map((chain) => (
                <ChainView key={chain.recipe.id} chain={chain} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

function ChainView({ chain }: { chain: Chain }) {
  const id = useId();
  return (
    <Collapsible key={id} defaultOpen={true}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <span className="w-full flex flex-row justify-between">
              <div>{chain.recipe.name}</div>
              <div>
                {chain.currentStep} / {chain.recipe.steps.length}
              </div>
            </span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {chain.recipe.steps.map((step, i) => (
              <SidebarMenuSubItem
                key={i}
                className={cn(
                  `h-6 whitespace-nowrap overflow-hidden select-none
                   [mask-image:linear-gradient(to_right,black,black,black,transparent)]`,
                  i < chain.currentStep ? "text-muted-foreground" : "",
                )}
                title={step.description}
              >
                {`${i + 1}. ${step.description}`}
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export const Route = createFileRoute("/walkthrough")({
  beforeLoad: validateAuth,
  component: WalkthroughPage,
});
