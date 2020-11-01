import {Pipe, PipeTransform} from '@angular/core';
import {
  DictUnitEvents,
  EventDictUnitAssign,
  EventDictUnitDelete,
  EventDictUnitSet,
  EventListUnitCopyWithin,
  EventListUnitDelete,
  EventListUnitFill,
  EventListUnitPop,
  EventListUnitPush,
  EventListUnitRemove,
  EventListUnitReverse,
  EventListUnitSet,
  EventListUnitShift,
  EventListUnitSort,
  EventListUnitSplice,
  EventListUnitUnshift,
  EventReplay,
  EventUnitClear,
  EventUnitClearCache,
  EventUnitClearPersistedValue,
  EventUnitClearValue,
  EventUnitDispatch,
  EventUnitDispatchFail,
  EventUnitFreeze,
  EventUnitJump,
  EventUnitReset,
  EventUnitResetValue,
  EventUnitUnfreeze,
  EventUnitUnmute,
  ListUnitEvents,
  UnitEvents,
} from '@activejs/core';

const EventsNameMap = new Map<UnitEvents<any> | ListUnitEvents<any> | DictUnitEvents<any>, string>([
  // common events
  [EventReplay, 'EventReplay'],
  // common Units events
  [EventUnitDispatch, 'EventUnitDispatch'],
  [EventUnitDispatchFail, 'EventUnitDispatchFail'],
  [EventUnitUnmute, 'EventUnitUnmute'],
  [EventUnitFreeze, 'EventUnitFreeze'],
  [EventUnitUnfreeze, 'EventUnitUnfreeze'],
  [EventUnitJump, 'EventUnitJump'],
  [EventUnitClearCache, 'EventUnitClearCache'],
  [EventUnitClearValue, 'EventUnitClearValue'],
  [EventUnitClear, 'EventUnitClear'],
  [EventUnitResetValue, 'EventUnitResetValue'],
  [EventUnitReset, 'EventUnitReset'],
  [EventUnitClearPersistedValue, 'EventUnitClearPersistedValue'],
  // DictUnit events
  [EventDictUnitSet, 'EventDictUnitSet'],
  [EventDictUnitDelete, 'EventDictUnitDelete'],
  [EventDictUnitAssign, 'EventDictUnitAssign'],
  // ListUnit events
  [EventListUnitSet, 'EventListUnitSet'],
  [EventListUnitPop, 'EventListUnitPop'],
  [EventListUnitPush, 'EventListUnitPush'],
  [EventListUnitShift, 'EventListUnitShift'],
  [EventListUnitUnshift, 'EventListUnitUnshift'],
  [EventListUnitDelete, 'EventListUnitDelete'],
  [EventListUnitRemove, 'EventListUnitRemove'],
  [EventListUnitSplice, 'EventListUnitSplice'],
  [EventListUnitFill, 'EventListUnitFill'],
  [EventListUnitCopyWithin, 'EventListUnitCopyWithin'],
  [EventListUnitReverse, 'EventListUnitReverse'],
  [EventListUnitSort, 'EventListUnitSort'],
]);

@Pipe({
  name: 'ajsEventName',
})
export class EventNamePipe implements PipeTransform {
  transform(event: UnitEvents<any> | DictUnitEvents<any> | ListUnitEvents<any>): string {
    return EventsNameMap.get(event?.constructor);
  }
}
