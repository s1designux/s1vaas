// design_origin/src/App.jsx CameraSettingsPage (line 2020~2093) algos 초기값을
// 카메라별 seed 로 확장한다. basic 2종 + ai 6종 = 카메라당 8 알고리즘.
// AI 이벤트는 AI 카메라 Process Flow(V0.76) 710 계열: 침입·배회·가상펜스·화재·주정차·피플카운팅.
import type { CameraAlgorithm } from '@/types/algorithm';
import { camerasSeed } from './cameras';

interface AlgoTemplate {
  algoKey: string;
  kind: 'basic' | 'ai';
  label: string;
  desc: string;
  enabled: boolean;
  sensitivity: 'low' | 'balanced' | 'high';
  zones: string[];
}

const TEMPLATE: AlgoTemplate[] = [
  {
    algoKey: 'motion',
    kind: 'basic',
    label: '움직임 감지',
    desc: '영상 내 움직임을 감지합니다',
    enabled: true,
    sensitivity: 'balanced',
    zones: ['전체 영역'],
  },
  {
    algoKey: 'privacy',
    kind: 'basic',
    label: '프라이버시 마스크',
    desc: '특정 영역을 가려 프라이버시를 보호합니다',
    enabled: false,
    sensitivity: 'balanced',
    zones: [],
  },
  {
    algoKey: 'intrusion',
    kind: 'ai',
    label: '침입 감지',
    desc: '설정 영역 침입을 감지합니다',
    enabled: true,
    sensitivity: 'high',
    zones: ['영역1'],
  },
  {
    algoKey: 'loitering',
    kind: 'ai',
    label: '배회 감지',
    desc: '일정 시간 이상 머무를 시 감지합니다',
    enabled: false,
    sensitivity: 'balanced',
    zones: [],
  },
  {
    algoKey: 'virtual_fence',
    kind: 'ai',
    label: '가상 펜스',
    desc: '가상 경계선 침범을 감지합니다',
    enabled: false,
    sensitivity: 'balanced',
    zones: [],
  },
  {
    algoKey: 'fire',
    kind: 'ai',
    label: '화재 감지',
    desc: '연기 및 화염을 감지합니다',
    enabled: false,
    sensitivity: 'high',
    zones: ['전체 영역'],
  },
  {
    algoKey: 'parking',
    kind: 'ai',
    label: '주정차 감시',
    desc: '지정 영역의 차량 주정차를 감지합니다',
    enabled: false,
    sensitivity: 'balanced',
    zones: ['전체 영역'],
  },
  {
    algoKey: 'people_counting',
    kind: 'ai',
    label: '피플카운팅',
    desc: '영역을 지나는 사람 수를 집계합니다',
    enabled: false,
    sensitivity: 'balanced',
    zones: ['전체 영역'],
  },
];

export const algorithmsSeed: CameraAlgorithm[] = camerasSeed.flatMap((cam) =>
  TEMPLATE.map((tpl) => ({
    id: `${cam.id}__${tpl.algoKey}`,
    cameraId: cam.id,
    algoKey: tpl.algoKey,
    kind: tpl.kind,
    label: tpl.label,
    desc: tpl.desc,
    enabled: tpl.enabled,
    sensitivity: tpl.sensitivity,
    zones: [...tpl.zones],
    polygons: [],
  })),
);
