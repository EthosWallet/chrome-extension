import { createContext, useContext } from 'react';

export interface WindowCloser {
    (): void;
}

export interface Heartbeat {
    onBeat(callback: () => void): void;
}

export interface Dependencies {
    closeWindow: WindowCloser;
    heartbeat: Heartbeat;
}
export const DependenciesContext = createContext<Dependencies | undefined>(
    undefined
);

export const useDependencies = (): Dependencies => {
    const dependencies = useContext(DependenciesContext);
    if (!dependencies) {
        throw new Error('Dependencies not found');
    }
    return dependencies;
};
