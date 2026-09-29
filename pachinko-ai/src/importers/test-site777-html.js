import {parseSite777GraphList} from './site777-html.js';
const html='<h2 id="machine_name"><a>e牙狼12黄金騎士極限</a>&nbsp;【4】パチ</h2><a onclick="javascript:tableNumClick(\'abc123\')";>台番:210</a><img src="https://www.d-deltanet.com/chart/RequestPcDedamaTransitionKahenRangeChart.do?param=XYZ=">';
const r=parseSite777GraphList(html);if(r.rate!==4||r.machines[0]?.machineNo!=='210'||!r.machines[0]?.chartUrl.includes('RequestPcDedama'))throw new Error('parser failed');console.log('ok',r);
