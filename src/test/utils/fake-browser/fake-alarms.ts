import type {Alarms} from 'webextension-polyfill/namespaces/alarms';

import {FakeEvent} from "_src/test/utils/fake-browser/fake-runtime";

export class FakeAlarms {
    names: string[] = [];
    create(name: string | undefined, alarmInfo: Alarms.CreateAlarmInfoType): void {
        if (name) {
            this.names.push(name);
        }
    }

    onAlarm: FakeEvent<(name: Alarms.Alarm) => void> = new FakeEvent();

    clear() {
        this.names = [];
    }
}
