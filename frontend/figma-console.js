// SW Design System — Figma Variables 자동 생성 스크립트
// 피그마 메뉴 → Plugins → Development → Open Console 에서 붙여넣기 후 실행
(async () => {
  const delay = ms => new Promise(r => setTimeout(r, ms));

  // ── 1. Primitive Collection ──
  const primCol = figma.variables.createVariableCollection('Primitive');
  primCol.renameMode(primCol.modes[0].modeId, 'Value');
  const primModeId = primCol.modes[0].modeId;
  const primVars = {};

  primVars['color/base/white'] = figma.variables.createVariable('color/base/white', primCol, 'COLOR');
  primVars['color/base/white'].setValueForMode(primModeId, {"r":1,"g":1,"b":1,"a":1});
  primVars['color/base/black'] = figma.variables.createVariable('color/base/black', primCol, 'COLOR');
  primVars['color/base/black'].setValueForMode(primModeId, {"r":0,"g":0,"b":0,"a":1});
  primVars['color/brand/blue'] = figma.variables.createVariable('color/brand/blue', primCol, 'COLOR');
  primVars['color/brand/blue'].setValueForMode(primModeId, {"r":0,"g":0.4471,"b":0.8078,"a":1});
  primVars['color/brand/red'] = figma.variables.createVariable('color/brand/red', primCol, 'COLOR');
  primVars['color/brand/red'].setValueForMode(primModeId, {"r":1,"g":0.1922,"b":0.1725,"a":1});
  primVars['color/brand/gray'] = figma.variables.createVariable('color/brand/gray', primCol, 'COLOR');
  primVars['color/brand/gray'].setValueForMode(primModeId, {"r":0.8745,"g":0.8706,"b":0.8706,"a":1});
  primVars['color/brand/ci'] = figma.variables.createVariable('color/brand/ci', primCol, 'COLOR');
  primVars['color/brand/ci'].setValueForMode(primModeId, {"r":0,"g":0.251,"b":0.5922,"a":1});
  primVars['color/brand/ci'].description = "CI/로고 전용. UI 직접 사용 금지";
  primVars['color/gray/0'] = figma.variables.createVariable('color/gray/0', primCol, 'COLOR');
  primVars['color/gray/0'].setValueForMode(primModeId, {"r":0.9804,"g":0.9804,"b":0.9804,"a":1});
  primVars['color/gray/50'] = figma.variables.createVariable('color/gray/50', primCol, 'COLOR');
  primVars['color/gray/50'].setValueForMode(primModeId, {"r":0.9608,"g":0.9608,"b":0.9608,"a":1});
  primVars['color/gray/100'] = figma.variables.createVariable('color/gray/100', primCol, 'COLOR');
  primVars['color/gray/100'].setValueForMode(primModeId, {"r":0.9137,"g":0.9137,"b":0.9137,"a":1});
  primVars['color/gray/200'] = figma.variables.createVariable('color/gray/200', primCol, 'COLOR');
  primVars['color/gray/200'].setValueForMode(primModeId, {"r":0.851,"g":0.851,"b":0.851,"a":1});
  primVars['color/gray/300'] = figma.variables.createVariable('color/gray/300', primCol, 'COLOR');
  primVars['color/gray/300'].setValueForMode(primModeId, {"r":0.7686,"g":0.7686,"b":0.7686,"a":1});
  primVars['color/gray/400'] = figma.variables.createVariable('color/gray/400', primCol, 'COLOR');
  primVars['color/gray/400'].setValueForMode(primModeId, {"r":0.6157,"g":0.6157,"b":0.6157,"a":1});
  primVars['color/gray/500'] = figma.variables.createVariable('color/gray/500', primCol, 'COLOR');
  primVars['color/gray/500'].setValueForMode(primModeId, {"r":0.4588,"g":0.4588,"b":0.4588,"a":1});
  primVars['color/gray/600'] = figma.variables.createVariable('color/gray/600', primCol, 'COLOR');
  primVars['color/gray/600'].setValueForMode(primModeId, {"r":0.3333,"g":0.3333,"b":0.3333,"a":1});
  primVars['color/gray/700'] = figma.variables.createVariable('color/gray/700', primCol, 'COLOR');
  primVars['color/gray/700'].setValueForMode(primModeId, {"r":0.2627,"g":0.2627,"b":0.2627,"a":1});
  primVars['color/gray/800'] = figma.variables.createVariable('color/gray/800', primCol, 'COLOR');
  primVars['color/gray/800'].setValueForMode(primModeId, {"r":0.2078,"g":0.2078,"b":0.2078,"a":1});
  primVars['color/gray/900'] = figma.variables.createVariable('color/gray/900', primCol, 'COLOR');
  primVars['color/gray/900'].setValueForMode(primModeId, {"r":0.1255,"g":0.1255,"b":0.1255,"a":1});
  primVars['color/gray-dark/0'] = figma.variables.createVariable('color/gray-dark/0', primCol, 'COLOR');
  primVars['color/gray-dark/0'].setValueForMode(primModeId, {"r":0.051,"g":0.0549,"b":0.0706,"a":1});
  primVars['color/gray-dark/50'] = figma.variables.createVariable('color/gray-dark/50', primCol, 'COLOR');
  primVars['color/gray-dark/50'].setValueForMode(primModeId, {"r":0.0745,"g":0.0784,"b":0.0941,"a":1});
  primVars['color/gray-dark/100'] = figma.variables.createVariable('color/gray-dark/100', primCol, 'COLOR');
  primVars['color/gray-dark/100'].setValueForMode(primModeId, {"r":0.1098,"g":0.1137,"b":0.1373,"a":1});
  primVars['color/gray-dark/200'] = figma.variables.createVariable('color/gray-dark/200', primCol, 'COLOR');
  primVars['color/gray-dark/200'].setValueForMode(primModeId, {"r":0.1412,"g":0.1451,"b":0.1725,"a":1});
  primVars['color/gray-dark/300'] = figma.variables.createVariable('color/gray-dark/300', primCol, 'COLOR');
  primVars['color/gray-dark/300'].setValueForMode(primModeId, {"r":0.1804,"g":0.1843,"b":0.2196,"a":1});
  primVars['color/gray-dark/400'] = figma.variables.createVariable('color/gray-dark/400', primCol, 'COLOR');
  primVars['color/gray-dark/400'].setValueForMode(primModeId, {"r":0.2078,"g":0.2118,"b":0.2471,"a":1});
  primVars['color/gray-dark/500'] = figma.variables.createVariable('color/gray-dark/500', primCol, 'COLOR');
  primVars['color/gray-dark/500'].setValueForMode(primModeId, {"r":0.2431,"g":0.251,"b":0.2863,"a":1});
  primVars['color/gray-dark/600'] = figma.variables.createVariable('color/gray-dark/600', primCol, 'COLOR');
  primVars['color/gray-dark/600'].setValueForMode(primModeId, {"r":0.3333,"g":0.3412,"b":0.3725,"a":1});
  primVars['color/gray-dark/700'] = figma.variables.createVariable('color/gray-dark/700', primCol, 'COLOR');
  primVars['color/gray-dark/700'].setValueForMode(primModeId, {"r":0.5412,"g":0.549,"b":0.5882,"a":1});
  primVars['color/gray-dark/800'] = figma.variables.createVariable('color/gray-dark/800', primCol, 'COLOR');
  primVars['color/gray-dark/800'].setValueForMode(primModeId, {"r":0.7216,"g":0.7294,"b":0.749,"a":1});
  primVars['color/gray-dark/900'] = figma.variables.createVariable('color/gray-dark/900', primCol, 'COLOR');
  primVars['color/gray-dark/900'].setValueForMode(primModeId, {"r":0.9255,"g":0.9294,"b":0.9412,"a":1});
  primVars['color/blue/50'] = figma.variables.createVariable('color/blue/50', primCol, 'COLOR');
  primVars['color/blue/50'].setValueForMode(primModeId, {"r":0.8863,"g":0.9451,"b":1,"a":1});
  primVars['color/blue/100'] = figma.variables.createVariable('color/blue/100', primCol, 'COLOR');
  primVars['color/blue/100'].setValueForMode(primModeId, {"r":0.7843,"g":0.8941,"b":1,"a":1});
  primVars['color/blue/150'] = figma.variables.createVariable('color/blue/150', primCol, 'COLOR');
  primVars['color/blue/150'].setValueForMode(primModeId, {"r":0.6431,"g":0.8314,"b":1,"a":1});
  primVars['color/blue/200'] = figma.variables.createVariable('color/blue/200', primCol, 'COLOR');
  primVars['color/blue/200'].setValueForMode(primModeId, {"r":0.5451,"g":0.7765,"b":1,"a":1});
  primVars['color/blue/250'] = figma.variables.createVariable('color/blue/250', primCol, 'COLOR');
  primVars['color/blue/250'].setValueForMode(primModeId, {"r":0.3569,"g":0.698,"b":1,"a":1});
  primVars['color/blue/300'] = figma.variables.createVariable('color/blue/300', primCol, 'COLOR');
  primVars['color/blue/300'].setValueForMode(primModeId, {"r":0.1686,"g":0.6196,"b":1,"a":1});
  primVars['color/blue/350'] = figma.variables.createVariable('color/blue/350', primCol, 'COLOR');
  primVars['color/blue/350'].setValueForMode(primModeId, {"r":0.149,"g":0.549,"b":0.9725,"a":1});
  primVars['color/blue/400'] = figma.variables.createVariable('color/blue/400', primCol, 'COLOR');
  primVars['color/blue/400'].setValueForMode(primModeId, {"r":0.1137,"g":0.4235,"b":0.9216,"a":1});
  primVars['color/blue/450'] = figma.variables.createVariable('color/blue/450', primCol, 'COLOR');
  primVars['color/blue/450'].setValueForMode(primModeId, {"r":0.1294,"g":0.3451,"b":0.7843,"a":1});
  primVars['color/blue/500'] = figma.variables.createVariable('color/blue/500', primCol, 'COLOR');
  primVars['color/blue/500'].setValueForMode(primModeId, {"r":0.1529,"g":0.2784,"b":0.7255,"a":1});
  primVars['color/blue-dark/50'] = figma.variables.createVariable('color/blue-dark/50', primCol, 'COLOR');
  primVars['color/blue-dark/50'].setValueForMode(primModeId, {"r":0.0471,"g":0.1137,"b":0.2196,"a":1});
  primVars['color/blue-dark/100'] = figma.variables.createVariable('color/blue-dark/100', primCol, 'COLOR');
  primVars['color/blue-dark/100'].setValueForMode(primModeId, {"r":0.0667,"g":0.1686,"b":0.3333,"a":1});
  primVars['color/blue-dark/150'] = figma.variables.createVariable('color/blue-dark/150', primCol, 'COLOR');
  primVars['color/blue-dark/150'].setValueForMode(primModeId, {"r":0.102,"g":0.2392,"b":0.4471,"a":1});
  primVars['color/blue-dark/200'] = figma.variables.createVariable('color/blue-dark/200', primCol, 'COLOR');
  primVars['color/blue-dark/200'].setValueForMode(primModeId, {"r":0.1294,"g":0.3059,"b":0.6275,"a":1});
  primVars['color/blue-dark/250'] = figma.variables.createVariable('color/blue-dark/250', primCol, 'COLOR');
  primVars['color/blue-dark/250'].setValueForMode(primModeId, {"r":0.1647,"g":0.3961,"b":0.7843,"a":1});
  primVars['color/blue-dark/300'] = figma.variables.createVariable('color/blue-dark/300', primCol, 'COLOR');
  primVars['color/blue-dark/300'].setValueForMode(primModeId, {"r":0.1882,"g":0.4392,"b":0.8471,"a":1});
  primVars['color/blue-dark/350'] = figma.variables.createVariable('color/blue-dark/350', primCol, 'COLOR');
  primVars['color/blue-dark/350'].setValueForMode(primModeId, {"r":0.2588,"g":0.5216,"b":0.9098,"a":1});
  primVars['color/blue-dark/400'] = figma.variables.createVariable('color/blue-dark/400', primCol, 'COLOR');
  primVars['color/blue-dark/400'].setValueForMode(primModeId, {"r":0.4353,"g":0.6471,"b":0.9725,"a":1});
  primVars['color/blue-dark/450'] = figma.variables.createVariable('color/blue-dark/450', primCol, 'COLOR');
  primVars['color/blue-dark/450'].setValueForMode(primModeId, {"r":0.5882,"g":0.7451,"b":0.9765,"a":1});
  primVars['color/blue-dark/500'] = figma.variables.createVariable('color/blue-dark/500', primCol, 'COLOR');
  primVars['color/blue-dark/500'].setValueForMode(primModeId, {"r":0.7529,"g":0.8471,"b":0.9882,"a":1});
  primVars['color/red/50'] = figma.variables.createVariable('color/red/50', primCol, 'COLOR');
  primVars['color/red/50'].setValueForMode(primModeId, {"r":1,"g":0.9216,"b":0.9373,"a":1});
  primVars['color/red/100'] = figma.variables.createVariable('color/red/100', primCol, 'COLOR');
  primVars['color/red/100'].setValueForMode(primModeId, {"r":1,"g":0.8,"b":0.8392,"a":1});
  primVars['color/red/150'] = figma.variables.createVariable('color/red/150', primCol, 'COLOR');
  primVars['color/red/150'].setValueForMode(primModeId, {"r":0.9843,"g":0.698,"b":0.7294,"a":1});
  primVars['color/red/200'] = figma.variables.createVariable('color/red/200', primCol, 'COLOR');
  primVars['color/red/200'].setValueForMode(primModeId, {"r":0.9725,"g":0.5922,"b":0.6196,"a":1});
  primVars['color/red/250'] = figma.variables.createVariable('color/red/250', primCol, 'COLOR');
  primVars['color/red/250'].setValueForMode(primModeId, {"r":0.9882,"g":0.4314,"b":0.4745,"a":1});
  primVars['color/red/300'] = figma.variables.createVariable('color/red/300', primCol, 'COLOR');
  primVars['color/red/300'].setValueForMode(primModeId, {"r":1,"g":0.2706,"b":0.3294,"a":1});
  primVars['color/red/350'] = figma.variables.createVariable('color/red/350', primCol, 'COLOR');
  primVars['color/red/350'].setValueForMode(primModeId, {"r":0.949,"g":0.1451,"b":0.2667,"a":1});
  primVars['color/red/400'] = figma.variables.createVariable('color/red/400', primCol, 'COLOR');
  primVars['color/red/400'].setValueForMode(primModeId, {"r":0.898,"g":0.0196,"b":0.2,"a":1});
  primVars['color/red/450'] = figma.variables.createVariable('color/red/450', primCol, 'COLOR');
  primVars['color/red/450'].setValueForMode(primModeId, {"r":0.8392,"g":0.0078,"b":0.1569,"a":1});
  primVars['color/red/500'] = figma.variables.createVariable('color/red/500', primCol, 'COLOR');
  primVars['color/red/500'].setValueForMode(primModeId, {"r":0.7843,"g":0,"b":0.1176,"a":1});
  primVars['color/red-dark/50'] = figma.variables.createVariable('color/red-dark/50', primCol, 'COLOR');
  primVars['color/red-dark/50'].setValueForMode(primModeId, {"r":0.1647,"g":0.0588,"b":0.0784,"a":1});
  primVars['color/red-dark/100'] = figma.variables.createVariable('color/red-dark/100', primCol, 'COLOR');
  primVars['color/red-dark/100'].setValueForMode(primModeId, {"r":0.2392,"g":0.0824,"b":0.1255,"a":1});
  primVars['color/red-dark/150'] = figma.variables.createVariable('color/red-dark/150', primCol, 'COLOR');
  primVars['color/red-dark/150'].setValueForMode(primModeId, {"r":0.3608,"g":0.1176,"b":0.1804,"a":1});
  primVars['color/red-dark/200'] = figma.variables.createVariable('color/red-dark/200', primCol, 'COLOR');
  primVars['color/red-dark/200'].setValueForMode(primModeId, {"r":0.5412,"g":0.1647,"b":0.2431,"a":1});
  primVars['color/red-dark/250'] = figma.variables.createVariable('color/red-dark/250', primCol, 'COLOR');
  primVars['color/red-dark/250'].setValueForMode(primModeId, {"r":0.7529,"g":0.2196,"b":0.3137,"a":1});
  primVars['color/red-dark/300'] = figma.variables.createVariable('color/red-dark/300', primCol, 'COLOR');
  primVars['color/red-dark/300'].setValueForMode(primModeId, {"r":0.8784,"g":0.2824,"b":0.3765,"a":1});
  primVars['color/red-dark/350'] = figma.variables.createVariable('color/red-dark/350', primCol, 'COLOR');
  primVars['color/red-dark/350'].setValueForMode(primModeId, {"r":0.9412,"g":0.3765,"b":0.4392,"a":1});
  primVars['color/red-dark/400'] = figma.variables.createVariable('color/red-dark/400', primCol, 'COLOR');
  primVars['color/red-dark/400'].setValueForMode(primModeId, {"r":0.9569,"g":0.5333,"b":0.5647,"a":1});
  primVars['color/red-dark/450'] = figma.variables.createVariable('color/red-dark/450', primCol, 'COLOR');
  primVars['color/red-dark/450'].setValueForMode(primModeId, {"r":0.9725,"g":0.6588,"b":0.6902,"a":1});
  primVars['color/red-dark/500'] = figma.variables.createVariable('color/red-dark/500', primCol, 'COLOR');
  primVars['color/red-dark/500'].setValueForMode(primModeId, {"r":0.9882,"g":0.8157,"b":0.8353,"a":1});
  primVars['color/orange/50'] = figma.variables.createVariable('color/orange/50', primCol, 'COLOR');
  primVars['color/orange/50'].setValueForMode(primModeId, {"r":1,"g":0.9294,"b":0.8784,"a":1});
  primVars['color/orange/100'] = figma.variables.createVariable('color/orange/100', primCol, 'COLOR');
  primVars['color/orange/100'].setValueForMode(primModeId, {"r":0.9922,"g":0.8588,"b":0.749,"a":1});
  primVars['color/orange/150'] = figma.variables.createVariable('color/orange/150', primCol, 'COLOR');
  primVars['color/orange/150'].setValueForMode(primModeId, {"r":0.9961,"g":0.7765,"b":0.6275,"a":1});
  primVars['color/orange/200'] = figma.variables.createVariable('color/orange/200', primCol, 'COLOR');
  primVars['color/orange/200'].setValueForMode(primModeId, {"r":1,"g":0.7059,"b":0.5098,"a":1});
  primVars['color/orange/250'] = figma.variables.createVariable('color/orange/250', primCol, 'COLOR');
  primVars['color/orange/250'].setValueForMode(primModeId, {"r":1,"g":0.5843,"b":0.3059,"a":1});
  primVars['color/orange/300'] = figma.variables.createVariable('color/orange/300', primCol, 'COLOR');
  primVars['color/orange/300'].setValueForMode(primModeId, {"r":1,"g":0.4627,"b":0.102,"a":1});
  primVars['color/orange/350'] = figma.variables.createVariable('color/orange/350', primCol, 'COLOR');
  primVars['color/orange/350'].setValueForMode(primModeId, {"r":0.9333,"g":0.4078,"b":0.051,"a":1});
  primVars['color/orange/400'] = figma.variables.createVariable('color/orange/400', primCol, 'COLOR');
  primVars['color/orange/400'].setValueForMode(primModeId, {"r":0.8549,"g":0.298,"b":0,"a":1});
  primVars['color/orange/450'] = figma.variables.createVariable('color/orange/450', primCol, 'COLOR');
  primVars['color/orange/450'].setValueForMode(primModeId, {"r":0.7137,"g":0.2353,"b":0,"a":1});
  primVars['color/orange/500'] = figma.variables.createVariable('color/orange/500', primCol, 'COLOR');
  primVars['color/orange/500'].setValueForMode(primModeId, {"r":0.5569,"g":0.1804,"b":0,"a":1});
  primVars['color/orange-dark/50'] = figma.variables.createVariable('color/orange-dark/50', primCol, 'COLOR');
  primVars['color/orange-dark/50'].setValueForMode(primModeId, {"r":0.1804,"g":0.0824,"b":0.0196,"a":1});
  primVars['color/orange-dark/100'] = figma.variables.createVariable('color/orange-dark/100', primCol, 'COLOR');
  primVars['color/orange-dark/100'].setValueForMode(primModeId, {"r":0.2588,"g":0.1255,"b":0.0392,"a":1});
  primVars['color/orange-dark/150'] = figma.variables.createVariable('color/orange-dark/150', primCol, 'COLOR');
  primVars['color/orange-dark/150'].setValueForMode(primModeId, {"r":0.4196,"g":0.2078,"b":0.0706,"a":1});
  primVars['color/orange-dark/200'] = figma.variables.createVariable('color/orange-dark/200', primCol, 'COLOR');
  primVars['color/orange-dark/200'].setValueForMode(primModeId, {"r":0.6275,"g":0.3137,"b":0.1255,"a":1});
  primVars['color/orange-dark/250'] = figma.variables.createVariable('color/orange-dark/250', primCol, 'COLOR');
  primVars['color/orange-dark/250'].setValueForMode(primModeId, {"r":0.8157,"g":0.4078,"b":0.1569,"a":1});
  primVars['color/orange-dark/300'] = figma.variables.createVariable('color/orange-dark/300', primCol, 'COLOR');
  primVars['color/orange-dark/300'].setValueForMode(primModeId, {"r":0.9098,"g":0.502,"b":0.2196,"a":1});
  primVars['color/orange-dark/350'] = figma.variables.createVariable('color/orange-dark/350', primCol, 'COLOR');
  primVars['color/orange-dark/350'].setValueForMode(primModeId, {"r":0.9412,"g":0.5843,"b":0.2824,"a":1});
  primVars['color/orange-dark/400'] = figma.variables.createVariable('color/orange-dark/400', primCol, 'COLOR');
  primVars['color/orange-dark/400'].setValueForMode(primModeId, {"r":0.9608,"g":0.6667,"b":0.4078,"a":1});
  primVars['color/orange-dark/450'] = figma.variables.createVariable('color/orange-dark/450', primCol, 'COLOR');
  primVars['color/orange-dark/450'].setValueForMode(primModeId, {"r":0.9725,"g":0.7529,"b":0.5647,"a":1});
  primVars['color/orange-dark/500'] = figma.variables.createVariable('color/orange-dark/500', primCol, 'COLOR');
  primVars['color/orange-dark/500'].setValueForMode(primModeId, {"r":0.9882,"g":0.8471,"b":0.7216,"a":1});
  primVars['color/yellow/50'] = figma.variables.createVariable('color/yellow/50', primCol, 'COLOR');
  primVars['color/yellow/50'].setValueForMode(primModeId, {"r":1,"g":0.9569,"b":0.8078,"a":1});
  primVars['color/yellow/100'] = figma.variables.createVariable('color/yellow/100', primCol, 'COLOR');
  primVars['color/yellow/100'].setValueForMode(primModeId, {"r":0.9961,"g":0.9098,"b":0.6039,"a":1});
  primVars['color/yellow/150'] = figma.variables.createVariable('color/yellow/150', primCol, 'COLOR');
  primVars['color/yellow/150'].setValueForMode(primModeId, {"r":0.9961,"g":0.8706,"b":0.4235,"a":1});
  primVars['color/yellow/200'] = figma.variables.createVariable('color/yellow/200', primCol, 'COLOR');
  primVars['color/yellow/200'].setValueForMode(primModeId, {"r":1,"g":0.8353,"b":0.2392,"a":1});
  primVars['color/yellow/250'] = figma.variables.createVariable('color/yellow/250', primCol, 'COLOR');
  primVars['color/yellow/250'].setValueForMode(primModeId, {"r":1,"g":0.8,"b":0.1176,"a":1});
  primVars['color/yellow/300'] = figma.variables.createVariable('color/yellow/300', primCol, 'COLOR');
  primVars['color/yellow/300'].setValueForMode(primModeId, {"r":1,"g":0.7608,"b":0,"a":1});
  primVars['color/yellow/350'] = figma.variables.createVariable('color/yellow/350', primCol, 'COLOR');
  primVars['color/yellow/350'].setValueForMode(primModeId, {"r":0.9608,"g":0.7255,"b":0,"a":1});
  primVars['color/yellow/400'] = figma.variables.createVariable('color/yellow/400', primCol, 'COLOR');
  primVars['color/yellow/400'].setValueForMode(primModeId, {"r":0.8588,"g":0.6431,"b":0,"a":1});
  primVars['color/yellow/450'] = figma.variables.createVariable('color/yellow/450', primCol, 'COLOR');
  primVars['color/yellow/450'].setValueForMode(primModeId, {"r":0.7294,"g":0.5373,"b":0,"a":1});
  primVars['color/yellow/500'] = figma.variables.createVariable('color/yellow/500', primCol, 'COLOR');
  primVars['color/yellow/500'].setValueForMode(primModeId, {"r":0.5608,"g":0.4157,"b":0,"a":1});
  primVars['color/yellow-dark/50'] = figma.variables.createVariable('color/yellow-dark/50', primCol, 'COLOR');
  primVars['color/yellow-dark/50'].setValueForMode(primModeId, {"r":0.1647,"g":0.1255,"b":0.0196,"a":1});
  primVars['color/yellow-dark/100'] = figma.variables.createVariable('color/yellow-dark/100', primCol, 'COLOR');
  primVars['color/yellow-dark/100'].setValueForMode(primModeId, {"r":0.2392,"g":0.1804,"b":0.0314,"a":1});
  primVars['color/yellow-dark/150'] = figma.variables.createVariable('color/yellow-dark/150', primCol, 'COLOR');
  primVars['color/yellow-dark/150'].setValueForMode(primModeId, {"r":0.3765,"g":0.3137,"b":0.0627,"a":1});
  primVars['color/yellow-dark/200'] = figma.variables.createVariable('color/yellow-dark/200', primCol, 'COLOR');
  primVars['color/yellow-dark/200'].setValueForMode(primModeId, {"r":0.5647,"g":0.4706,"b":0.0941,"a":1});
  primVars['color/yellow-dark/250'] = figma.variables.createVariable('color/yellow-dark/250', primCol, 'COLOR');
  primVars['color/yellow-dark/250'].setValueForMode(primModeId, {"r":0.7529,"g":0.5961,"b":0.1569,"a":1});
  primVars['color/yellow-dark/300'] = figma.variables.createVariable('color/yellow-dark/300', primCol, 'COLOR');
  primVars['color/yellow-dark/300'].setValueForMode(primModeId, {"r":0.8471,"g":0.6902,"b":0.2196,"a":1});
  primVars['color/yellow-dark/350'] = figma.variables.createVariable('color/yellow-dark/350', primCol, 'COLOR');
  primVars['color/yellow-dark/350'].setValueForMode(primModeId, {"r":0.9098,"g":0.7529,"b":0.2824,"a":1});
  primVars['color/yellow-dark/400'] = figma.variables.createVariable('color/yellow-dark/400', primCol, 'COLOR');
  primVars['color/yellow-dark/400'].setValueForMode(primModeId, {"r":0.9412,"g":0.8157,"b":0.4078,"a":1});
  primVars['color/yellow-dark/450'] = figma.variables.createVariable('color/yellow-dark/450', primCol, 'COLOR');
  primVars['color/yellow-dark/450'].setValueForMode(primModeId, {"r":0.9608,"g":0.8706,"b":0.5647,"a":1});
  primVars['color/yellow-dark/500'] = figma.variables.createVariable('color/yellow-dark/500', primCol, 'COLOR');
  primVars['color/yellow-dark/500'].setValueForMode(primModeId, {"r":0.9804,"g":0.9176,"b":0.7216,"a":1});
  primVars['color/green/50'] = figma.variables.createVariable('color/green/50', primCol, 'COLOR');
  primVars['color/green/50'].setValueForMode(primModeId, {"r":0.8902,"g":0.949,"b":0.9176,"a":1});
  primVars['color/green/100'] = figma.variables.createVariable('color/green/100', primCol, 'COLOR');
  primVars['color/green/100'].setValueForMode(primModeId, {"r":0.7922,"g":0.9255,"b":0.8549,"a":1});
  primVars['color/green/150'] = figma.variables.createVariable('color/green/150', primCol, 'COLOR');
  primVars['color/green/150'].setValueForMode(primModeId, {"r":0.6118,"g":0.8471,"b":0.7412,"a":1});
  primVars['color/green/200'] = figma.variables.createVariable('color/green/200', primCol, 'COLOR');
  primVars['color/green/200'].setValueForMode(primModeId, {"r":0.4353,"g":0.7686,"b":0.6353,"a":1});
  primVars['color/green/250'] = figma.variables.createVariable('color/green/250', primCol, 'COLOR');
  primVars['color/green/250'].setValueForMode(primModeId, {"r":0.2784,"g":0.7333,"b":0.5569,"a":1});
  primVars['color/green/300'] = figma.variables.createVariable('color/green/300', primCol, 'COLOR');
  primVars['color/green/300'].setValueForMode(primModeId, {"r":0.1216,"g":0.698,"b":0.4745,"a":1});
  primVars['color/green/350'] = figma.variables.createVariable('color/green/350', primCol, 'COLOR');
  primVars['color/green/350'].setValueForMode(primModeId, {"r":0.0627,"g":0.6588,"b":0.4235,"a":1});
  primVars['color/green/400'] = figma.variables.createVariable('color/green/400', primCol, 'COLOR');
  primVars['color/green/400'].setValueForMode(primModeId, {"r":0,"g":0.6196,"b":0.3686,"a":1});
  primVars['color/green/450'] = figma.variables.createVariable('color/green/450', primCol, 'COLOR');
  primVars['color/green/450'].setValueForMode(primModeId, {"r":0,"g":0.5255,"b":0.3137,"a":1});
  primVars['color/green/500'] = figma.variables.createVariable('color/green/500', primCol, 'COLOR');
  primVars['color/green/500'].setValueForMode(primModeId, {"r":0,"g":0.4353,"b":0.2588,"a":1});
  primVars['color/green-dark/50'] = figma.variables.createVariable('color/green-dark/50', primCol, 'COLOR');
  primVars['color/green-dark/50'].setValueForMode(primModeId, {"r":0.0392,"g":0.1255,"b":0.0941,"a":1});
  primVars['color/green-dark/100'] = figma.variables.createVariable('color/green-dark/100', primCol, 'COLOR');
  primVars['color/green-dark/100'].setValueForMode(primModeId, {"r":0.0627,"g":0.1804,"b":0.1333,"a":1});
  primVars['color/green-dark/150'] = figma.variables.createVariable('color/green-dark/150', primCol, 'COLOR');
  primVars['color/green-dark/150'].setValueForMode(primModeId, {"r":0.0941,"g":0.2706,"b":0.1882,"a":1});
  primVars['color/green-dark/200'] = figma.variables.createVariable('color/green-dark/200', primCol, 'COLOR');
  primVars['color/green-dark/200'].setValueForMode(primModeId, {"r":0.1255,"g":0.4078,"b":0.251,"a":1});
  primVars['color/green-dark/250'] = figma.variables.createVariable('color/green-dark/250', primCol, 'COLOR');
  primVars['color/green-dark/250'].setValueForMode(primModeId, {"r":0.1569,"g":0.5412,"b":0.3333,"a":1});
  primVars['color/green-dark/300'] = figma.variables.createVariable('color/green-dark/300', primCol, 'COLOR');
  primVars['color/green-dark/300'].setValueForMode(primModeId, {"r":0.1882,"g":0.6588,"b":0.4078,"a":1});
  primVars['color/green-dark/350'] = figma.variables.createVariable('color/green-dark/350', primCol, 'COLOR');
  primVars['color/green-dark/350'].setValueForMode(primModeId, {"r":0.2471,"g":0.7451,"b":0.4941,"a":1});
  primVars['color/green-dark/400'] = figma.variables.createVariable('color/green-dark/400', primCol, 'COLOR');
  primVars['color/green-dark/400'].setValueForMode(primModeId, {"r":0.4078,"g":0.8157,"b":0.5961,"a":1});
  primVars['color/green-dark/450'] = figma.variables.createVariable('color/green-dark/450', primCol, 'COLOR');
  primVars['color/green-dark/450'].setValueForMode(primModeId, {"r":0.5961,"g":0.8784,"b":0.7216,"a":1});
  primVars['color/green-dark/500'] = figma.variables.createVariable('color/green-dark/500', primCol, 'COLOR');
  primVars['color/green-dark/500'].setValueForMode(primModeId, {"r":0.7725,"g":0.9412,"b":0.8471,"a":1});
  primVars['color/skyblue/50'] = figma.variables.createVariable('color/skyblue/50', primCol, 'COLOR');
  primVars['color/skyblue/50'].setValueForMode(primModeId, {"r":0.7686,"g":0.9333,"b":0.9686,"a":1});
  primVars['color/skyblue/100'] = figma.variables.createVariable('color/skyblue/100', primCol, 'COLOR');
  primVars['color/skyblue/100'].setValueForMode(primModeId, {"r":0.6471,"g":0.898,"b":0.9529,"a":1});
  primVars['color/skyblue/150'] = figma.variables.createVariable('color/skyblue/150', primCol, 'COLOR');
  primVars['color/skyblue/150'].setValueForMode(primModeId, {"r":0.4824,"g":0.8392,"b":0.9176,"a":1});
  primVars['color/skyblue/200'] = figma.variables.createVariable('color/skyblue/200', primCol, 'COLOR');
  primVars['color/skyblue/200'].setValueForMode(primModeId, {"r":0.3176,"g":0.7804,"b":0.8824,"a":1});
  primVars['color/skyblue/250'] = figma.variables.createVariable('color/skyblue/250', primCol, 'COLOR');
  primVars['color/skyblue/250'].setValueForMode(primModeId, {"r":0.2314,"g":0.7529,"b":0.8667,"a":1});
  primVars['color/skyblue/300'] = figma.variables.createVariable('color/skyblue/300', primCol, 'COLOR');
  primVars['color/skyblue/300'].setValueForMode(primModeId, {"r":0.1451,"g":0.7255,"b":0.8549,"a":1});
  primVars['color/skyblue/350'] = figma.variables.createVariable('color/skyblue/350', primCol, 'COLOR');
  primVars['color/skyblue/350'].setValueForMode(primModeId, {"r":0.1137,"g":0.6667,"b":0.7961,"a":1});
  primVars['color/skyblue/400'] = figma.variables.createVariable('color/skyblue/400', primCol, 'COLOR');
  primVars['color/skyblue/400'].setValueForMode(primModeId, {"r":0.0824,"g":0.6078,"b":0.7373,"a":1});
  primVars['color/skyblue/450'] = figma.variables.createVariable('color/skyblue/450', primCol, 'COLOR');
  primVars['color/skyblue/450'].setValueForMode(primModeId, {"r":0.0706,"g":0.5176,"b":0.6275,"a":1});
  primVars['color/skyblue/500'] = figma.variables.createVariable('color/skyblue/500', primCol, 'COLOR');
  primVars['color/skyblue/500'].setValueForMode(primModeId, {"r":0.0588,"g":0.4235,"b":0.5176,"a":1});
  primVars['color/skyblue-dark/50'] = figma.variables.createVariable('color/skyblue-dark/50', primCol, 'COLOR');
  primVars['color/skyblue-dark/50'].setValueForMode(primModeId, {"r":0.0314,"g":0.1176,"b":0.1569,"a":1});
  primVars['color/skyblue-dark/100'] = figma.variables.createVariable('color/skyblue-dark/100', primCol, 'COLOR');
  primVars['color/skyblue-dark/100'].setValueForMode(primModeId, {"r":0.0627,"g":0.1647,"b":0.2196,"a":1});
  primVars['color/skyblue-dark/150'] = figma.variables.createVariable('color/skyblue-dark/150', primCol, 'COLOR');
  primVars['color/skyblue-dark/150'].setValueForMode(primModeId, {"r":0.0941,"g":0.251,"b":0.3137,"a":1});
  primVars['color/skyblue-dark/200'] = figma.variables.createVariable('color/skyblue-dark/200', primCol, 'COLOR');
  primVars['color/skyblue-dark/200'].setValueForMode(primModeId, {"r":0.1255,"g":0.3529,"b":0.4392,"a":1});
  primVars['color/skyblue-dark/250'] = figma.variables.createVariable('color/skyblue-dark/250', primCol, 'COLOR');
  primVars['color/skyblue-dark/250'].setValueForMode(primModeId, {"r":0.1569,"g":0.4706,"b":0.5647,"a":1});
  primVars['color/skyblue-dark/300'] = figma.variables.createVariable('color/skyblue-dark/300', primCol, 'COLOR');
  primVars['color/skyblue-dark/300'].setValueForMode(primModeId, {"r":0.1882,"g":0.5647,"b":0.6588,"a":1});
  primVars['color/skyblue-dark/350'] = figma.variables.createVariable('color/skyblue-dark/350', primCol, 'COLOR');
  primVars['color/skyblue-dark/350'].setValueForMode(primModeId, {"r":0.251,"g":0.6588,"b":0.7529,"a":1});
  primVars['color/skyblue-dark/400'] = figma.variables.createVariable('color/skyblue-dark/400', primCol, 'COLOR');
  primVars['color/skyblue-dark/400'].setValueForMode(primModeId, {"r":0.4078,"g":0.7529,"b":0.8471,"a":1});
  primVars['color/skyblue-dark/450'] = figma.variables.createVariable('color/skyblue-dark/450', primCol, 'COLOR');
  primVars['color/skyblue-dark/450'].setValueForMode(primModeId, {"r":0.5961,"g":0.8471,"b":0.9098,"a":1});
  primVars['color/skyblue-dark/500'] = figma.variables.createVariable('color/skyblue-dark/500', primCol, 'COLOR');
  primVars['color/skyblue-dark/500'].setValueForMode(primModeId, {"r":0.7529,"g":0.9098,"b":0.9412,"a":1});
  primVars['color/purple/50'] = figma.variables.createVariable('color/purple/50', primCol, 'COLOR');
  primVars['color/purple/50'].setValueForMode(primModeId, {"r":0.9098,"g":0.9137,"b":0.9882,"a":1});
  primVars['color/purple/100'] = figma.variables.createVariable('color/purple/100', primCol, 'COLOR');
  primVars['color/purple/100'].setValueForMode(primModeId, {"r":0.8118,"g":0.8196,"b":0.9765,"a":1});
  primVars['color/purple/150'] = figma.variables.createVariable('color/purple/150', primCol, 'COLOR');
  primVars['color/purple/150'].setValueForMode(primModeId, {"r":0.7529,"g":0.7529,"b":0.9882,"a":1});
  primVars['color/purple/200'] = figma.variables.createVariable('color/purple/200', primCol, 'COLOR');
  primVars['color/purple/200'].setValueForMode(primModeId, {"r":0.6902,"g":0.6902,"b":1,"a":1});
  primVars['color/purple/250'] = figma.variables.createVariable('color/purple/250', primCol, 'COLOR');
  primVars['color/purple/250'].setValueForMode(primModeId, {"r":0.5451,"g":0.5451,"b":0.9333,"a":1});
  primVars['color/purple/300'] = figma.variables.createVariable('color/purple/300', primCol, 'COLOR');
  primVars['color/purple/300'].setValueForMode(primModeId, {"r":0.4,"g":0.4,"b":0.8667,"a":1});
  primVars['color/purple/350'] = figma.variables.createVariable('color/purple/350', primCol, 'COLOR');
  primVars['color/purple/350'].setValueForMode(primModeId, {"r":0.3059,"g":0.3059,"b":0.7647,"a":1});
  primVars['color/purple/400'] = figma.variables.createVariable('color/purple/400', primCol, 'COLOR');
  primVars['color/purple/400'].setValueForMode(primModeId, {"r":0.2078,"g":0.2078,"b":0.6588,"a":1});
  primVars['color/purple/450'] = figma.variables.createVariable('color/purple/450', primCol, 'COLOR');
  primVars['color/purple/450'].setValueForMode(primModeId, {"r":0.1765,"g":0.1765,"b":0.5608,"a":1});
  primVars['color/purple/500'] = figma.variables.createVariable('color/purple/500', primCol, 'COLOR');
  primVars['color/purple/500'].setValueForMode(primModeId, {"r":0.1451,"g":0.1451,"b":0.4627,"a":1});
  primVars['color/purple-dark/50'] = figma.variables.createVariable('color/purple-dark/50', primCol, 'COLOR');
  primVars['color/purple-dark/50'].setValueForMode(primModeId, {"r":0.0784,"g":0.0784,"b":0.1647,"a":1});
  primVars['color/purple-dark/100'] = figma.variables.createVariable('color/purple-dark/100', primCol, 'COLOR');
  primVars['color/purple-dark/100'].setValueForMode(primModeId, {"r":0.1176,"g":0.1176,"b":0.2392,"a":1});
  primVars['color/purple-dark/150'] = figma.variables.createVariable('color/purple-dark/150', primCol, 'COLOR');
  primVars['color/purple-dark/150'].setValueForMode(primModeId, {"r":0.1647,"g":0.1647,"b":0.3451,"a":1});
  primVars['color/purple-dark/200'] = figma.variables.createVariable('color/purple-dark/200', primCol, 'COLOR');
  primVars['color/purple-dark/200'].setValueForMode(primModeId, {"r":0.2196,"g":0.2196,"b":0.4706,"a":1});
  primVars['color/purple-dark/250'] = figma.variables.createVariable('color/purple-dark/250', primCol, 'COLOR');
  primVars['color/purple-dark/250'].setValueForMode(primModeId, {"r":0.2824,"g":0.2824,"b":0.6275,"a":1});
  primVars['color/purple-dark/300'] = figma.variables.createVariable('color/purple-dark/300', primCol, 'COLOR');
  primVars['color/purple-dark/300'].setValueForMode(primModeId, {"r":0.3451,"g":0.3451,"b":0.7216,"a":1});
  primVars['color/purple-dark/350'] = figma.variables.createVariable('color/purple-dark/350', primCol, 'COLOR');
  primVars['color/purple-dark/350'].setValueForMode(primModeId, {"r":0.4392,"g":0.4392,"b":0.8157,"a":1});
  primVars['color/purple-dark/400'] = figma.variables.createVariable('color/purple-dark/400', primCol, 'COLOR');
  primVars['color/purple-dark/400'].setValueForMode(primModeId, {"r":0.5647,"g":0.5647,"b":0.8784,"a":1});
  primVars['color/purple-dark/450'] = figma.variables.createVariable('color/purple-dark/450', primCol, 'COLOR');
  primVars['color/purple-dark/450'].setValueForMode(primModeId, {"r":0.6902,"g":0.6902,"b":0.9176,"a":1});
  primVars['color/purple-dark/500'] = figma.variables.createVariable('color/purple-dark/500', primCol, 'COLOR');
  primVars['color/purple-dark/500'].setValueForMode(primModeId, {"r":0.8157,"g":0.8157,"b":0.9608,"a":1});
  primVars['color/brown/50'] = figma.variables.createVariable('color/brown/50', primCol, 'COLOR');
  primVars['color/brown/50'].setValueForMode(primModeId, {"r":0.9647,"g":0.9333,"b":0.9137,"a":1});
  primVars['color/brown/100'] = figma.variables.createVariable('color/brown/100', primCol, 'COLOR');
  primVars['color/brown/100'].setValueForMode(primModeId, {"r":0.8941,"g":0.8353,"b":0.7843,"a":1});
  primVars['color/brown/150'] = figma.variables.createVariable('color/brown/150', primCol, 'COLOR');
  primVars['color/brown/150'].setValueForMode(primModeId, {"r":0.8588,"g":0.7765,"b":0.702,"a":1});
  primVars['color/brown/200'] = figma.variables.createVariable('color/brown/200', primCol, 'COLOR');
  primVars['color/brown/200'].setValueForMode(primModeId, {"r":0.8196,"g":0.7137,"b":0.6235,"a":1});
  primVars['color/brown/250'] = figma.variables.createVariable('color/brown/250', primCol, 'COLOR');
  primVars['color/brown/250'].setValueForMode(primModeId, {"r":0.651,"g":0.549,"b":0.4588,"a":1});
  primVars['color/brown/300'] = figma.variables.createVariable('color/brown/300', primCol, 'COLOR');
  primVars['color/brown/300'].setValueForMode(primModeId, {"r":0.4863,"g":0.3804,"b":0.2902,"a":1});
  primVars['color/brown/350'] = figma.variables.createVariable('color/brown/350', primCol, 'COLOR');
  primVars['color/brown/350'].setValueForMode(primModeId, {"r":0.4078,"g":0.3216,"b":0.251,"a":1});
  primVars['color/brown/400'] = figma.variables.createVariable('color/brown/400', primCol, 'COLOR');
  primVars['color/brown/400'].setValueForMode(primModeId, {"r":0.3333,"g":0.2667,"b":0.2078,"a":1});
  primVars['color/brown/450'] = figma.variables.createVariable('color/brown/450', primCol, 'COLOR');
  primVars['color/brown/450'].setValueForMode(primModeId, {"r":0.2824,"g":0.2275,"b":0.1765,"a":1});
  primVars['color/brown/500'] = figma.variables.createVariable('color/brown/500', primCol, 'COLOR');
  primVars['color/brown/500'].setValueForMode(primModeId, {"r":0.2314,"g":0.1882,"b":0.1451,"a":1});
  primVars['color/brown-dark/50'] = figma.variables.createVariable('color/brown-dark/50', primCol, 'COLOR');
  primVars['color/brown-dark/50'].setValueForMode(primModeId, {"r":0.1176,"g":0.0863,"b":0.0627,"a":1});
  primVars['color/brown-dark/100'] = figma.variables.createVariable('color/brown-dark/100', primCol, 'COLOR');
  primVars['color/brown-dark/100'].setValueForMode(primModeId, {"r":0.1647,"g":0.1255,"b":0.0941,"a":1});
  primVars['color/brown-dark/150'] = figma.variables.createVariable('color/brown-dark/150', primCol, 'COLOR');
  primVars['color/brown-dark/150'].setValueForMode(primModeId, {"r":0.2392,"g":0.1882,"b":0.1451,"a":1});
  primVars['color/brown-dark/200'] = figma.variables.createVariable('color/brown-dark/200', primCol, 'COLOR');
  primVars['color/brown-dark/200'].setValueForMode(primModeId, {"r":0.3451,"g":0.2706,"b":0.2078,"a":1});
  primVars['color/brown-dark/250'] = figma.variables.createVariable('color/brown-dark/250', primCol, 'COLOR');
  primVars['color/brown-dark/250'].setValueForMode(primModeId, {"r":0.4706,"g":0.3765,"b":0.3137,"a":1});
  primVars['color/brown-dark/300'] = figma.variables.createVariable('color/brown-dark/300', primCol, 'COLOR');
  primVars['color/brown-dark/300'].setValueForMode(primModeId, {"r":0.5647,"g":0.4706,"b":0.4078,"a":1});
  primVars['color/brown-dark/350'] = figma.variables.createVariable('color/brown-dark/350', primCol, 'COLOR');
  primVars['color/brown-dark/350'].setValueForMode(primModeId, {"r":0.6588,"g":0.5647,"b":0.502,"a":1});
  primVars['color/brown-dark/400'] = figma.variables.createVariable('color/brown-dark/400', primCol, 'COLOR');
  primVars['color/brown-dark/400'].setValueForMode(primModeId, {"r":0.7529,"g":0.6588,"b":0.5961,"a":1});
  primVars['color/brown-dark/450'] = figma.variables.createVariable('color/brown-dark/450', primCol, 'COLOR');
  primVars['color/brown-dark/450'].setValueForMode(primModeId, {"r":0.8471,"g":0.7529,"b":0.6902,"a":1});
  primVars['color/brown-dark/500'] = figma.variables.createVariable('color/brown-dark/500', primCol, 'COLOR');
  primVars['color/brown-dark/500'].setValueForMode(primModeId, {"r":0.9098,"g":0.8471,"b":0.7843,"a":1});
  primVars['color/visual-gray/50'] = figma.variables.createVariable('color/visual-gray/50', primCol, 'COLOR');
  primVars['color/visual-gray/50'].setValueForMode(primModeId, {"r":0.9529,"g":0.9608,"b":0.9686,"a":1});
  primVars['color/visual-gray/100'] = figma.variables.createVariable('color/visual-gray/100', primCol, 'COLOR');
  primVars['color/visual-gray/100'].setValueForMode(primModeId, {"r":0.9098,"g":0.9216,"b":0.9373,"a":1});
  primVars['color/visual-gray/150'] = figma.variables.createVariable('color/visual-gray/150', primCol, 'COLOR');
  primVars['color/visual-gray/150'].setValueForMode(primModeId, {"r":0.8549,"g":0.8706,"b":0.898,"a":1});
  primVars['color/visual-gray/200'] = figma.variables.createVariable('color/visual-gray/200', primCol, 'COLOR');
  primVars['color/visual-gray/200'].setValueForMode(primModeId, {"r":0.8039,"g":0.8235,"b":0.8706,"a":1});
  primVars['color/visual-gray/250'] = figma.variables.createVariable('color/visual-gray/250', primCol, 'COLOR');
  primVars['color/visual-gray/250'].setValueForMode(primModeId, {"r":0.6706,"g":0.698,"b":0.749,"a":1});
  primVars['color/visual-gray/300'] = figma.variables.createVariable('color/visual-gray/300', primCol, 'COLOR');
  primVars['color/visual-gray/300'].setValueForMode(primModeId, {"r":0.502,"g":0.5294,"b":0.5882,"a":1});
  primVars['color/visual-gray/350'] = figma.variables.createVariable('color/visual-gray/350', primCol, 'COLOR');
  primVars['color/visual-gray/350'].setValueForMode(primModeId, {"r":0.3922,"g":0.4157,"b":0.4549,"a":1});
  primVars['color/visual-gray/400'] = figma.variables.createVariable('color/visual-gray/400', primCol, 'COLOR');
  primVars['color/visual-gray/400'].setValueForMode(primModeId, {"r":0.2431,"g":0.2627,"b":0.2784,"a":1});
  primVars['color/visual-gray/450'] = figma.variables.createVariable('color/visual-gray/450', primCol, 'COLOR');
  primVars['color/visual-gray/450'].setValueForMode(primModeId, {"r":0.1686,"g":0.1843,"b":0.1961,"a":1});
  primVars['color/visual-gray/500'] = figma.variables.createVariable('color/visual-gray/500', primCol, 'COLOR');
  primVars['color/visual-gray/500'].setValueForMode(primModeId, {"r":0.1059,"g":0.1137,"b":0.1216,"a":1});
  primVars['color/coolgray-dark/50'] = figma.variables.createVariable('color/coolgray-dark/50', primCol, 'COLOR');
  primVars['color/coolgray-dark/50'].setValueForMode(primModeId, {"r":0.0706,"g":0.0784,"b":0.102,"a":1});
  primVars['color/coolgray-dark/100'] = figma.variables.createVariable('color/coolgray-dark/100', primCol, 'COLOR');
  primVars['color/coolgray-dark/100'].setValueForMode(primModeId, {"r":0.102,"g":0.1137,"b":0.1451,"a":1});
  primVars['color/coolgray-dark/150'] = figma.variables.createVariable('color/coolgray-dark/150', primCol, 'COLOR');
  primVars['color/coolgray-dark/150'].setValueForMode(primModeId, {"r":0.1451,"g":0.1569,"b":0.1882,"a":1});
  primVars['color/coolgray-dark/200'] = figma.variables.createVariable('color/coolgray-dark/200', primCol, 'COLOR');
  primVars['color/coolgray-dark/200'].setValueForMode(primModeId, {"r":0.2078,"g":0.2196,"b":0.251,"a":1});
  primVars['color/coolgray-dark/250'] = figma.variables.createVariable('color/coolgray-dark/250', primCol, 'COLOR');
  primVars['color/coolgray-dark/250'].setValueForMode(primModeId, {"r":0.2824,"g":0.298,"b":0.3451,"a":1});
  primVars['color/coolgray-dark/300'] = figma.variables.createVariable('color/coolgray-dark/300', primCol, 'COLOR');
  primVars['color/coolgray-dark/300'].setValueForMode(primModeId, {"r":0.3765,"g":0.3922,"b":0.4392,"a":1});
  primVars['color/coolgray-dark/350'] = figma.variables.createVariable('color/coolgray-dark/350', primCol, 'COLOR');
  primVars['color/coolgray-dark/350'].setValueForMode(primModeId, {"r":0.4706,"g":0.4863,"b":0.5333,"a":1});
  primVars['color/coolgray-dark/400'] = figma.variables.createVariable('color/coolgray-dark/400', primCol, 'COLOR');
  primVars['color/coolgray-dark/400'].setValueForMode(primModeId, {"r":0.5961,"g":0.6118,"b":0.6588,"a":1});
  primVars['color/coolgray-dark/450'] = figma.variables.createVariable('color/coolgray-dark/450', primCol, 'COLOR');
  primVars['color/coolgray-dark/450'].setValueForMode(primModeId, {"r":0.7216,"g":0.7373,"b":0.7725,"a":1});
  primVars['color/coolgray-dark/500'] = figma.variables.createVariable('color/coolgray-dark/500', primCol, 'COLOR');
  primVars['color/coolgray-dark/500'].setValueForMode(primModeId, {"r":0.8471,"g":0.8588,"b":0.8784,"a":1});
  primVars['color/status-dark/red'] = figma.variables.createVariable('color/status-dark/red', primCol, 'COLOR');
  primVars['color/status-dark/red'].setValueForMode(primModeId, {"r":0.9412,"g":0.3765,"b":0.4392,"a":1});
  primVars['color/status-dark/red'].description = "= red-dark/350 alias";
  primVars['color/status-dark/green'] = figma.variables.createVariable('color/status-dark/green', primCol, 'COLOR');
  primVars['color/status-dark/green'].setValueForMode(primModeId, {"r":0.2471,"g":0.7451,"b":0.4941,"a":1});
  primVars['color/status-dark/green'].description = "= green-dark/350 alias";
  primVars['color/status-dark/yellow'] = figma.variables.createVariable('color/status-dark/yellow', primCol, 'COLOR');
  primVars['color/status-dark/yellow'].setValueForMode(primModeId, {"r":0.9098,"g":0.7529,"b":0.2824,"a":1});
  primVars['color/status-dark/yellow'].description = "= yellow-dark/350 alias";

  // ── 2. Semantic Collection (Light / Dark) ──
  const semCol = figma.variables.createVariableCollection('Semantic');
  semCol.renameMode(semCol.modes[0].modeId, 'Light');
  const lightModeId = semCol.modes[0].modeId;
  const darkModeId  = semCol.addMode('Dark');

  {
    const v = figma.variables.createVariable('color/bg/default', semCol, 'COLOR');
    v.description = "페이지 기본 배경";
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/0'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/50'].id });
  }
  {
    const v = figma.variables.createVariable('color/bg/subtle', semCol, 'COLOR');
    v.description = "보조 배경";
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/50'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/200'].id });
  }
  {
    const v = figma.variables.createVariable('color/bg/muted', semCol, 'COLOR');
    v.description = "강조 배경";
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/100'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/300'].id });
  }
  {
    const v = figma.variables.createVariable('color/bg/elevated', semCol, 'COLOR');
    v.description = "툴바·elevated";
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/100'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/400'].id });
  }
  {
    const v = figma.variables.createVariable('color/bg/home', semCol, 'COLOR');
    v.description = "홈 배경 — Primitive 미등록, 검토 중";
    v.setValueForMode(lightModeId, {"r":0.9608,"g":0.9647,"b":0.9843,"a":1});
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/50'].id });
  }
  {
    const v = figma.variables.createVariable('color/bg/selected', semCol, 'COLOR');
    v.description = "선택 행 배경 — 임시값";
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue/50'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue-dark/100'].id });
  }
  {
    const v = figma.variables.createVariable('color/surface/default', semCol, 'COLOR');
    v.description = "카드·패널 표면";
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/base/white'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/100'].id });
  }
  {
    const v = figma.variables.createVariable('color/surface/raised', semCol, 'COLOR');
    v.description = "팝오버·드롭다운";
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/base/white'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/400'].id });
  }
  {
    const v = figma.variables.createVariable('color/text/primary', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/900'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/900'].id });
  }
  {
    const v = figma.variables.createVariable('color/text/secondary', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/800'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/800'].id });
  }
  {
    const v = figma.variables.createVariable('color/text/tertiary', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/600'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/700'].id });
  }
  {
    const v = figma.variables.createVariable('color/text/caption', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/500'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/700'].id });
  }
  {
    const v = figma.variables.createVariable('color/text/placeholder', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/400'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/600'].id });
  }
  {
    const v = figma.variables.createVariable('color/text/helper', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/400'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/600'].id });
  }
  {
    const v = figma.variables.createVariable('color/text/link', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue/400'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue-dark/400'].id });
  }
  {
    const v = figma.variables.createVariable('color/text/correct', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue/400'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue-dark/400'].id });
  }
  {
    const v = figma.variables.createVariable('color/text/danger', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/red/300'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/status-dark/red'].id });
  }
  {
    const v = figma.variables.createVariable('color/text/disabled', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/300'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/400'].id });
  }
  {
    const v = figma.variables.createVariable('color/text/inverse', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/base/white'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/base/white'].id });
  }
  {
    const v = figma.variables.createVariable('color/border/subtle', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/100'].id });
    v.setValueForMode(darkModeId, {"r":1,"g":1,"b":1,"a":0.04});
  }
  {
    const v = figma.variables.createVariable('color/border/default', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/200'].id });
    v.setValueForMode(darkModeId, {"r":1,"g":1,"b":1,"a":0.07});
  }
  {
    const v = figma.variables.createVariable('color/border/strong', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/300'].id });
    v.setValueForMode(darkModeId, {"r":1,"g":1,"b":1,"a":0.12});
  }
  {
    const v = figma.variables.createVariable('color/border/emphasis', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/800'].id });
    v.setValueForMode(darkModeId, {"r":1,"g":1,"b":1,"a":0.2});
  }
  {
    const v = figma.variables.createVariable('color/border/focus', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue/400'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue-dark/350'].id });
  }
  {
    const v = figma.variables.createVariable('color/border/white', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/base/white'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/base/white'].id });
  }
  {
    const v = figma.variables.createVariable('color/border/danger', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/red/300'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/status-dark/red'].id });
  }
  {
    const v = figma.variables.createVariable('color/border/correct', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue/400'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue-dark/350'].id });
  }
  {
    const v = figma.variables.createVariable('color/icon/default', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/500'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/700'].id });
  }
  {
    const v = figma.variables.createVariable('color/icon/muted', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/300'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/400'].id });
  }
  {
    const v = figma.variables.createVariable('color/icon/emphasis', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/800'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/800'].id });
  }
  {
    const v = figma.variables.createVariable('color/icon/accent', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue/400'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue-dark/400'].id });
  }
  {
    const v = figma.variables.createVariable('color/icon/inverse', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/base/white'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/base/white'].id });
  }
  {
    const v = figma.variables.createVariable('color/icon/danger', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/red/300'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/status-dark/red'].id });
  }
  {
    const v = figma.variables.createVariable('color/action/primary/default', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue/400'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue-dark/300'].id });
  }
  {
    const v = figma.variables.createVariable('color/action/primary/hover', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue/450'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue-dark/250'].id });
  }
  {
    const v = figma.variables.createVariable('color/action/primary/pressed', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue/500'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue-dark/200'].id });
  }
  {
    const v = figma.variables.createVariable('color/action/primary/text', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/base/white'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/base/white'].id });
  }
  {
    const v = figma.variables.createVariable('color/action/primary/subtle', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue/50'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue-dark/100'].id });
  }
  {
    const v = figma.variables.createVariable('color/status/success', semCol, 'COLOR');
    v.description = "Light — blue 계열";
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/blue/400'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/status-dark/green'].id });
  }
  {
    const v = figma.variables.createVariable('color/status/error', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/red/400'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/status-dark/red'].id });
  }
  {
    const v = figma.variables.createVariable('color/status/warning', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/yellow/400'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/status-dark/yellow'].id });
  }
  {
    const v = figma.variables.createVariable('color/status/info', semCol, 'COLOR');
    v.setValueForMode(lightModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray/500'].id });
    v.setValueForMode(darkModeId, { type: 'VARIABLE_ALIAS', id: primVars['color/gray-dark/700'].id });
  }
  {
    const v = figma.variables.createVariable('color/overlay', semCol, 'COLOR');
    v.description = "rgba 허용 예외";
    v.setValueForMode(lightModeId, {"r":0,"g":0,"b":0,"a":0.5});
    v.setValueForMode(darkModeId, {"r":0,"g":0,"b":0,"a":0.75});
  }

  console.log('✅ Variables 생성 완료!');
  console.log('  Primitive:', primCol.variableIds.length, '개');
  console.log('  Semantic:', semCol.variableIds.length, '개 (Light/Dark)');

  // ── 3. 기존 노드에 시멘틱 토큰 바인딩 ──────────────────────────
  console.log('▶ 시멘틱 토큰 바인딩 시작...');

  // 색상을 정수(0-255) 기반 키로 변환 — 부동소수점 오차 흡수
  function colorKey(r, g, b, a) {
    return [r, g, b, a].map(v => Math.round(v * 255)).join(',');
  }

  // Light 모드 기준: 시멘틱 색상값 → Variable 객체 맵 구성
  const colorToVar = new Map();
  for (const varId of semCol.variableIds) {
    const sv = figma.variables.getVariableById(varId);
    if (!sv) continue;

    // alias 체인을 끝까지 resolve
    let val = sv.valuesByMode[lightModeId];
    let depth = 0;
    while (val && val.type === 'VARIABLE_ALIAS' && depth < 8) {
      const ref = figma.variables.getVariableById(val.id);
      if (!ref) break;
      // primitive는 단일 모드
      val = ref.valuesByMode[Object.keys(ref.valuesByMode)[0]];
      depth++;
    }

    if (val && typeof val.r === 'number') {
      const key = colorKey(val.r, val.g, val.b, val.a ?? 1);
      if (!colorToVar.has(key)) colorToVar.set(key, sv); // 먼저 매핑된 시멘틱 우선
    }
  }

  let boundCount = 0;
  let skipCount  = 0;

  function bindFills(paints, sv) {
    let changed = false;
    const result = paints.map(p => {
      if (p.type !== 'SOLID') return p;
      if (p.boundVariables?.color) return p;              // 이미 바인딩됨 → 건너뜀
      const key = colorKey(p.color.r, p.color.g, p.color.b, p.opacity ?? 1);
      const match = colorToVar.get(key);
      if (!match) return p;
      changed = true;
      boundCount++;
      return figma.variables.setBoundVariableForPaint(p, 'color', match);
    });
    return { result, changed };
  }

  function applyToNode(node) {
    // fills
    if ('fills' in node && Array.isArray(node.fills) && node.fills.length) {
      try {
        const { result, changed } = bindFills(node.fills, null);
        if (changed) node.fills = result;
      } catch (e) { skipCount++; }
    }
    // strokes
    if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length) {
      try {
        const { result, changed } = bindFills(node.strokes, null);
        if (changed) node.strokes = result;
      } catch (e) { skipCount++; }
    }
    // 자식 노드 재귀
    if ('children' in node) {
      for (const child of node.children) applyToNode(child);
    }
  }

  // 모든 페이지 순회
  for (const page of figma.root.children) {
    await figma.setCurrentPageAsync(page);
    for (const child of figma.currentPage.children) {
      applyToNode(child);
    }
    await delay(100); // 페이지 전환 후 안정화 대기
  }

  console.log(`✅ 바인딩 완료 — ${boundCount}건 적용 / ${skipCount}건 스킵`);
})();