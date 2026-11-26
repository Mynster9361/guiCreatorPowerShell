/* GUI Creator - control definitions (Avalonia / GliderUI)
 * Each type describes: the XAML element, default size, properties shown in the
 * property grid, events offered in the Events tab and how the designer draws it. */
(function () {
  'use strict';
  const GC = (window.GC = window.GC || {});

  const P = (key, type, def, cat, extra) => Object.assign({ key, type, def, cat }, extra || {});

  const HALIGN = ['Left', 'Center', 'Right', 'Stretch'];
  const VALIGN = ['Top', 'Center', 'Bottom', 'Stretch'];
  const WRAP = ['NoWrap', 'Wrap', 'WrapWithOverflow'];
  const TALIGN = ['Left', 'Center', 'Right', 'Justify'];
  const ORIENT = ['Horizontal', 'Vertical'];

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const lines = (s) => String(s || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length);
  const num = (v, d) => (v === '' || v == null || isNaN(Number(v)) ? d : Number(v));
  const flexH = { Left: 'flex-start', Center: 'center', Right: 'flex-end', Stretch: 'stretch' };
  const flexV = { Top: 'flex-start', Center: 'center', Bottom: 'flex-end', Stretch: 'stretch' };
  const hasClass = (p, c) => String(p.Classes || '').split(/\s+/).includes(c);
  const pct = (p) => {
    const min = num(p.Minimum, 0), max = num(p.Maximum, 100), v = num(p.Value, 0);
    return max > min ? Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100)) : 0;
  };
  /** Avalonia colours put alpha first (#AARRGGBB, #ARGB); CSS puts it last (#RRGGBBAA, #RGBA). */
  GC.cssColor = (v) => {
    const s = String(v == null ? '' : v).trim();
    const m = /^#([0-9a-f]{2})([0-9a-f]{6})$/i.exec(s) || /^#([0-9a-f])([0-9a-f]{3})$/i.exec(s);
    return m ? `#${m[2]}${m[1]}` : s;
  };
  /** Avalonia CornerRadius ("8", "8,0,0,0" = top-left, top-right, bottom-right, bottom-left) as CSS. */
  const cssRadius = (v) => {
    const parts = String(v == null ? '' : v).split(/[\s,]+/).filter(Boolean).map((x) => num(x, 0));
    if (parts.length === 4) return parts.map((x) => x + 'px').join(' ');
    if (parts.length === 2) return `${parts[0]}px ${parts[0]}px ${parts[1]}px ${parts[1]}px`; // top, bottom
    return (parts[0] || 0) + 'px';
  };
  // Date pickers follow the user's culture in Avalonia; the browser's locale stands in for it.
  let dateFmt;
  const dateFormatParts = () => {
    try {
      dateFmt = dateFmt || new Intl.DateTimeFormat(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(2001, 10, 22));
    } catch (e) {
      dateFmt = [{ type: 'month' }, { type: 'literal', value: '/' }, { type: 'day' }, { type: 'literal', value: '/' }, { type: 'year' }];
    }
    return dateFmt;
  };
  /** 'day' | 'month' | 'year' in the order of the short date, e.g. ['day', 'month', 'year']. */
  const dateParts = () => dateFormatParts().map((x) => x.type).filter((t) => t === 'day' || t === 'month' || t === 'year');
  /** The short date pattern, e.g. 'dd-MM-yyyy'. */
  const datePattern = () => dateFormatParts().map((x) => ({ day: 'dd', month: 'MM', year: 'yyyy' })[x.type] || (x.type === 'literal' ? x.value : '')).join('');

  // Properties available on every control (Appearance / Behavior)
  const COMMON_PROPS = [
    P('Background', 'color', '', 'Appearance'),
    P('Foreground', 'color', '', 'Appearance'),
    P('FontFamily', 'text', '', 'Appearance'),
    P('FontSize', 'number', '', 'Appearance'),
    P('FontWeight', 'enum', 'Normal', 'Appearance', { options: ['Normal', 'Light', 'SemiBold', 'Bold', 'ExtraBold'] }),
    P('FontStyle', 'enum', 'Normal', 'Appearance', { options: ['Normal', 'Italic'] }),
    P('Opacity', 'number', 1, 'Appearance'),
    P('Classes', 'text', '', 'Appearance', { hint: 'Style classes, e.g. "accent"' }),
    P('IsEnabled', 'bool', true, 'Behavior'),
    P('IsVisible', 'bool', true, 'Behavior'),
    P('ToolTip', 'text', '', 'Behavior', { xaml: 'ToolTip.Tip' }),
    P('Cursor', 'enum', '', 'Behavior', { options: ['', 'Arrow', 'Hand', 'IBeam', 'Wait', 'Cross', 'Help', 'No', 'SizeAll'] }),
    P('Tag', 'text', '', 'Data'),
  ];
  const FONT_KEYS = ['Foreground', 'FontFamily', 'FontSize', 'FontWeight', 'FontStyle'];

  const COMMON_EVENTS = ['GotFocus', 'LostFocus', 'PointerEntered', 'PointerExited', 'PointerPressed', 'PointerReleased', 'KeyDown', 'KeyUp'];

  const FORM_PROPS = [
    P('Title', 'text', '', 'Common'),
    P('Width', 'number', 640, 'Layout', { forceEmit: true }),
    P('Height', 'number', 420, 'Layout', { forceEmit: true }),
    P('MinWidth', 'number', '', 'Layout', { hint: 'Smallest width the user can resize the window to.' }),
    P('MinHeight', 'number', '', 'Layout', { hint: 'Smallest height the user can resize the window to.' }),
    P('WindowStartupLocation', 'enum', 'CenterScreen', 'Layout', { options: ['Manual', 'CenterScreen', 'CenterOwner'], forceEmit: true }),
    P('CanResize', 'bool', true, 'Behavior'),
    P('CanMinimize', 'bool', true, 'Behavior'),
    P('CanMaximize', 'bool', true, 'Behavior'),
    P('Topmost', 'bool', false, 'Behavior'),
    P('ShowInTaskbar', 'bool', true, 'Behavior'),
    P('GliderUISetup', 'enum', 'InstallIfMissing', 'Behavior', {
      options: ['InstallIfMissing', 'CheckOnly', 'ImportOnly'],
      noXaml: true,
      hint: 'Startup form only. What the exported script does before it shows the window. InstallIfMissing: install GliderUI and its server for the current user if they are missing (no admin needed), then import it. CheckOnly: stop with a clear message if something is missing. ImportOnly: just Import-Module GliderUI.',
    }),
    P('RequestedThemeVariant', 'enum', 'Default', 'Appearance', { options: ['Default', 'Light', 'Dark'] }),
    P('ExtendClientAreaToDecorationsHint', 'bool', false, 'Appearance', { hint: 'Draw the content under the title bar (no title text, caption buttons float on top). Height then includes the title bar area.' }),
    P('Background', 'color', '', 'Appearance'),
    P('FontFamily', 'text', '', 'Appearance'),
    P('FontSize', 'number', '', 'Appearance'),
  ];
  const FORM_EVENTS = ['Opened', 'Closing', 'Closed', 'Activated', 'Deactivated', 'KeyDown', 'KeyUp'];

  const MENU_PROPS = [
    P('Items', 'menu', '', 'Common', {
      hint: 'One item per line. Indent (4 spaces) for sub-items, "-" for a separator, "_" before the access-key letter.',
    }),
  ];

  const itemsXaml = (tag) => (n, ind) =>
    lines(n.props.Items).map((it) => `${ind}<${tag} Content="${GC.xattr(it)}"/>`);

  /** DataGrid columns: "Header | Property | StringFormat" per line. */
  const dgCols = (text) =>
    lines(text).map((l) => {
      const [hdr, prop, f] = l.split('|').map((s) => s.trim());
      return { h: hdr, p: (prop || hdr).replace(/[^A-Za-z0-9_.]/g, ''), f: f || '' };
    });

  const TYPES = {
    Button: {
      label: 'Button', prefix: 'button', size: [100, 32], textProp: 'Content', defaultEvent: 'Click',
      props: [
        P('Content', 'text', '', 'Common'),
        // Avalonia's own default is Left/Top (text against the left edge); always written so the
        // centered text the designer shows is what the window shows.
        P('HorizontalContentAlignment', 'enum', 'Center', 'Layout', { options: HALIGN, forceEmit: true }),
        P('VerticalContentAlignment', 'enum', 'Center', 'Layout', { options: VALIGN, forceEmit: true }),
        P('IsDefault', 'bool', false, 'Behavior'),
        P('IsCancel', 'bool', false, 'Behavior'),
      ],
      events: ['Click'],
      render: (n, p) =>
        `<div class="v-btn${hasClass(p, 'accent') ? ' accent' : ''}" style="justify-content:${flexH[p.HorizontalContentAlignment]};align-items:${flexV[p.VerticalContentAlignment]}"><span>${esc(p.Content)}</span></div>`,
    },
    TextBlock: {
      valueProp: 'Text', valueInputOnly: true, label: 'Label', prefix: 'label', size: [100, 20], textProp: 'Text', defaultEvent: 'PointerPressed',
      props: [
        P('Text', 'multiline', '', 'Common'),
        P('TextWrapping', 'enum', 'NoWrap', 'Layout', { options: WRAP }),
        P('TextAlignment', 'enum', 'Left', 'Layout', { options: TALIGN }),
        P('TextTrimming', 'enum', 'None', 'Layout', { options: ['None', 'CharacterEllipsis', 'WordEllipsis'] }),
      ],
      events: [],
      render: (n, p) =>
        `<div class="v-label" style="text-align:${p.TextAlignment.toLowerCase()};white-space:${p.TextWrapping === 'NoWrap' ? 'pre' : 'pre-wrap'};${p.TextTrimming !== 'None' ? 'text-overflow:ellipsis;' : ''}">${esc(p.Text)}</div>`,
    },
    TextBox: {
      valueProp: 'Text', label: 'TextBox', prefix: 'textbox', size: [200, 32], defaultEvent: 'TextChanged',
      props: [
        P('Text', 'multiline', '', 'Common'),
        P('Watermark', 'text', '', 'Common'),
        P('PasswordChar', 'text', '', 'Behavior'),
        P('AcceptsReturn', 'bool', false, 'Behavior'),
        P('AcceptsTab', 'bool', false, 'Behavior'),
        P('IsReadOnly', 'bool', false, 'Behavior'),
        P('MaxLength', 'number', '', 'Behavior'),
        P('TextWrapping', 'enum', 'NoWrap', 'Layout', { options: WRAP }),
        P('TextAlignment', 'enum', 'Left', 'Layout', { options: TALIGN }),
      ],
      events: ['TextChanged'],
      render: (n, p) => {
        const multi = p.AcceptsReturn || p.TextWrapping !== 'NoWrap';
        let inner;
        if (p.Text) inner = p.PasswordChar ? esc(String(p.PasswordChar)[0].repeat(String(p.Text).length)) : esc(p.Text);
        else inner = `<span class="ph">${esc(p.Watermark)}</span>`;
        return `<div class="v-tb${multi ? ' multi' : ''}" style="text-align:${p.TextAlignment.toLowerCase()};white-space:${multi ? 'pre-wrap' : 'pre'}">${inner}</div>`;
      },
    },
    CheckBox: {
      valueProp: 'IsChecked', label: 'CheckBox', prefix: 'checkbox', size: [120, 32], textProp: 'Content', defaultEvent: 'IsCheckedChanged',
      props: [P('Content', 'text', '', 'Common'), P('IsChecked', 'bool', false, 'Common'), P('IsThreeState', 'bool', false, 'Behavior')],
      events: ['IsCheckedChanged', 'Click'],
      render: (n, p) => `<div class="v-chk"><span class="box${p.IsChecked ? ' on' : ''}">${p.IsChecked ? '&#10003;' : ''}</span><span class="lbl">${esc(p.Content)}</span></div>`,
    },
    RadioButton: {
      valueProp: 'IsChecked', label: 'RadioButton', prefix: 'radiobutton', size: [120, 32], textProp: 'Content', defaultEvent: 'IsCheckedChanged',
      props: [P('Content', 'text', '', 'Common'), P('IsChecked', 'bool', false, 'Common'), P('GroupName', 'text', '', 'Behavior')],
      events: ['IsCheckedChanged', 'Click'],
      render: (n, p) => `<div class="v-chk"><span class="box round${p.IsChecked ? ' on' : ''}"><i></i></span><span class="lbl">${esc(p.Content)}</span></div>`,
    },
    ToggleButton: {
      valueProp: 'IsChecked', label: 'ToggleButton', prefix: 'togglebutton', size: [100, 32], textProp: 'Content', defaultEvent: 'IsCheckedChanged',
      props: [P('Content', 'text', '', 'Common'), P('IsChecked', 'bool', false, 'Common')],
      events: ['IsCheckedChanged', 'Click'],
      render: (n, p) => `<div class="v-btn${p.IsChecked ? ' accent' : ''}"><span>${esc(p.Content)}</span></div>`,
    },
    ToggleSwitch: {
      valueProp: 'IsChecked', label: 'ToggleSwitch', prefix: 'toggleswitch', size: [140, 32], defaultEvent: 'IsCheckedChanged',
      props: [
        P('Content', 'text', '', 'Common', { hint: 'Header shown above the switch' }),
        P('IsChecked', 'bool', false, 'Common'),
        P('OnContent', 'text', '', 'Common'),
        P('OffContent', 'text', '', 'Common'),
      ],
      events: ['IsCheckedChanged', 'Click'],
      render: (n, p) =>
        `<div class="v-ts">${p.Content ? `<div class="hdr">${esc(p.Content)}</div>` : ''}<div class="row"><span class="sw${p.IsChecked ? ' on' : ''}"><i></i></span><span>${esc(p.IsChecked ? p.OnContent || 'On' : p.OffContent || 'Off')}</span></div></div>`,
    },
    HyperlinkButton: {
      label: 'HyperlinkButton', prefix: 'hyperlink', size: [140, 32], textProp: 'Content', defaultEvent: 'Click',
      props: [P('Content', 'text', '', 'Common'), P('NavigateUri', 'text', '', 'Behavior')],
      events: ['Click'],
      render: (n, p) => `<div class="v-link"><span>${esc(p.Content)}</span></div>`,
    },
    ComboBox: {
      valueProp: 'SelectedIndex', label: 'ComboBox', prefix: 'combobox', size: [200, 32], defaultEvent: 'SelectionChanged',
      props: [
        P('Items', 'list', '', 'Common', { noXaml: true, hint: 'One item per line' }),
        P('SelectedIndex', 'number', -1, 'Common', { post: true }),
        P('PlaceholderText', 'text', '', 'Common'),
      ],
      events: ['SelectionChanged', 'DropDownOpened', 'DropDownClosed'],
      xamlChildren: itemsXaml('ComboBoxItem'),
      render: (n, p) => {
        const sel = lines(p.Items)[num(p.SelectedIndex, -1)];
        return `<div class="v-cb"><span class="${sel ? '' : 'ph'}">${esc(sel || p.PlaceholderText)}</span><span class="chev"></span></div>`;
      },
    },
    ListBox: {
      valueProp: 'SelectedIndex', label: 'ListBox', prefix: 'listbox', size: [200, 140], defaultEvent: 'SelectionChanged',
      props: [
        P('Items', 'list', '', 'Common', { noXaml: true, hint: 'One item per line' }),
        P('SelectedIndex', 'number', -1, 'Common', { post: true }),
        P('SelectionMode', 'enum', 'Single', 'Behavior', { options: ['Single', 'Multiple', 'Toggle', 'AlwaysSelected'] }),
      ],
      events: ['SelectionChanged', 'DoubleTapped'],
      xamlChildren: itemsXaml('ListBoxItem'),
      render: (n, p) => {
        const si = num(p.SelectedIndex, -1);
        return `<div class="v-lb">${lines(p.Items).map((it, i) => `<div class="it${i === si ? ' sel' : ''}">${esc(it)}</div>`).join('')}</div>`;
      },
    },
    DataGrid: {
      label: 'DataGrid', prefix: 'datagrid', size: [400, 200], defaultEvent: 'SelectionChanged',
      preset: { Columns: 'Name | Name\nValue | Value' },
      props: [
        P('Columns', 'list', '', 'Common', { noXaml: true, hint: 'One column per line: Header | Property | StringFormat (optional), e.g. "PM(MB) | PM | {0:F2}". Fill it from PowerShell with $grid.ItemsSource and [DataSource] objects.' }),
        P('CanUserReorderColumns', 'bool', false, 'Behavior'),
        P('CanUserResizeColumns', 'bool', false, 'Behavior'),
        P('CanUserSortColumns', 'bool', true, 'Behavior'),
        P('IsReadOnly', 'bool', false, 'Behavior'),
        P('SelectionMode', 'enum', 'Extended', 'Behavior', { options: ['Extended', 'Single'] }),
        P('GridLinesVisibility', 'enum', 'None', 'Appearance', { options: ['None', 'Horizontal', 'Vertical', 'All'] }),
      ],
      events: ['SelectionChanged', 'DoubleTapped', 'CellEditEnded'],
      xamlChildren: (n, ind) => {
        const cols = dgCols(n.props.Columns);
        if (!cols.length) return [];
        return [`${ind}<DataGrid.Columns>`]
          .concat(cols.map((c) => `${ind}    <DataGridTextColumn Header="${GC.xattr(c.h)}" Binding="${GC.xattr(`{Binding ${c.p}${c.f ? ', StringFormat={}' + c.f : ''}}`)}" SortMemberPath="${c.p}" />`))
          .concat(`${ind}</DataGrid.Columns>`);
      },
      render: (n, p) => {
        const cols = dgCols(p.Columns);
        return `<div class="v-dg"><div class="hd">${cols.length ? cols.map((c) => `<div class="c">${esc(c.h)}</div>`).join('') : '<div class="c">(no columns)</div>'}<div class="rest"></div></div><div class="body"></div></div>`;
      },
    },
    Slider: {
      valueProp: 'Value', label: 'Slider', prefix: 'slider', size: [200, 32], defaultEvent: 'ValueChanged',
      props: [
        P('Minimum', 'number', 0, 'Common'),
        P('Maximum', 'number', 100, 'Common'),
        P('Value', 'number', 0, 'Common'),
        P('SmallChange', 'number', 1, 'Behavior'),
        P('LargeChange', 'number', 10, 'Behavior'),
        P('TickFrequency', 'number', '', 'Behavior'),
        P('TickPlacement', 'enum', 'None', 'Appearance', { options: ['None', 'TopLeft', 'BottomRight', 'Outside'] }),
        P('IsSnapToTickEnabled', 'bool', false, 'Behavior'),
        P('Orientation', 'enum', 'Horizontal', 'Layout', { options: ORIENT }),
      ],
      events: ['ValueChanged'],
      render: (n, p) => {
        const v = pct(p);
        // the thumb (22px) travels within the track, so 0% and 100% keep it inside the control
        return p.Orientation === 'Vertical'
          ? `<div class="v-sl vert"><div class="track"><div class="fill" style="height:${v}%"></div></div><div class="thumb" style="bottom:calc(${v} * (100% - 22px) / 100)"></div></div>`
          : `<div class="v-sl"><div class="track"><div class="fill" style="width:${v}%"></div></div><div class="thumb" style="left:calc(${v} * (100% - 22px) / 100)"></div></div>`;
      },
    },
    ProgressBar: {
      valueProp: 'Value', label: 'ProgressBar', prefix: 'progressbar', size: [200, 16], defaultEvent: 'PointerPressed',
      props: [
        P('Minimum', 'number', 0, 'Common'),
        P('Maximum', 'number', 100, 'Common'),
        P('Value', 'number', 0, 'Common'),
        P('IsIndeterminate', 'bool', false, 'Behavior'),
        P('ShowProgressText', 'bool', false, 'Appearance'),
        P('Orientation', 'enum', 'Horizontal', 'Layout', { options: ORIENT }),
      ],
      events: [],
      render: (n, p) => {
        const v = p.IsIndeterminate ? 35 : pct(p);
        return `<div class="v-pb${p.IsIndeterminate ? ' indet' : ''}"><div class="track"><div class="fill" style="width:${v}%"></div></div>${p.ShowProgressText && !p.IsIndeterminate ? `<span>${Math.round(v)}%</span>` : ''}</div>`;
      },
    },
    NumericUpDown: {
      valueProp: 'Value', label: 'NumericUpDown', prefix: 'numericupdown', size: [150, 32], defaultEvent: 'ValueChanged',
      props: [
        P('Value', 'number', '', 'Common'),
        P('Minimum', 'number', '', 'Common'),
        P('Maximum', 'number', '', 'Common'),
        P('Increment', 'number', 1, 'Common'),
        P('FormatString', 'text', '', 'Appearance'),
        P('Watermark', 'text', '', 'Common'),
      ],
      events: ['ValueChanged'],
      render: (n, p) =>
        `<div class="v-tb v-nud"><span class="${p.Value === '' ? 'ph' : ''}">${esc(p.Value === '' ? p.Watermark : p.Value)}</span><span class="spin"><i class="chev up"></i><i class="chev"></i></span></div>`,
    },
    DatePicker: {
      valueProp: 'SelectedDate', label: 'DatePicker', prefix: 'datepicker', size: [300, 32], defaultEvent: 'SelectedDateChanged',
      props: [P('DayVisible', 'bool', true, 'Appearance'), P('MonthVisible', 'bool', true, 'Appearance'), P('YearVisible', 'bool', true, 'Appearance')],
      events: ['SelectedDateChanged'],
      // Avalonia orders the columns by the user's culture; the browser's locale is the best guess here.
      render: (n, p) =>
        `<div class="v-seg v-date">${dateParts().filter((s) => p[s[0].toUpperCase() + s.slice(1) + 'Visible']).map((s) => `<span class="${s}">${s}</span>`).join('')}</div>`,
    },
    CalendarDatePicker: {
      valueProp: 'SelectedDate', label: 'CalendarDatePicker', prefix: 'calendardatepicker', size: [170, 32], defaultEvent: 'SelectedDateChanged',
      props: [P('Watermark', 'text', '', 'Common')],
      events: ['SelectedDateChanged'],
      // Without a Watermark, Avalonia shows the culture's short date pattern, e.g. <dd-MM-yyyy>.
      render: (n, p) => `<div class="v-tb v-cal"><span class="ph">${esc(p.Watermark || `<${datePattern()}>`)}</span><span class="calico"></span></div>`,
    },
    TimePicker: {
      valueProp: 'SelectedTime', label: 'TimePicker', prefix: 'timepicker', size: [240, 32], defaultEvent: 'SelectedTimeChanged',
      // Always written: without it Avalonia follows the culture (24-hour in most of Europe), while
      // the designer shows the chosen clock.
      props: [P('ClockIdentifier', 'enum', '12HourClock', 'Behavior', { options: ['12HourClock', '24HourClock'], forceEmit: true }), P('MinuteIncrement', 'number', 1, 'Behavior')],
      events: ['SelectedTimeChanged'],
      render: (n, p) => `<div class="v-seg"><span>hour</span><span>minute</span>${p.ClockIdentifier === '12HourClock' ? '<span>AM</span>' : ''}</div>`,
    },
    Border: {
      label: 'Panel', prefix: 'panel', size: [220, 150], container: true, defaultEvent: 'PointerPressed', noCommon: FONT_KEYS,
      preset: { BorderBrush: 'Gray', BorderThickness: '1' },
      props: [P('BorderBrush', 'color', '', 'Appearance'), P('BorderThickness', 'text', '', 'Appearance'), P('CornerRadius', 'text', '', 'Appearance')],
      events: [],
      render: (n, p) => {
        const bt = num(String(p.BorderThickness).split(/[ ,]+/)[0], 0);
        return `<div class="v-border" style="border:${bt}px solid ${esc(GC.cssColor(p.BorderBrush) || 'transparent')};border-radius:${cssRadius(p.CornerRadius)}"><div class="slot" data-owner="${n.id}" data-slot="0"></div></div>`;
      },
    },
    GroupBox: {
      label: 'GroupBox', prefix: 'groupbox', size: [240, 170], container: true, textProp: 'Header', defaultEvent: 'PointerPressed',
      props: [P('Header', 'text', '', 'Common')],
      events: [],
      render: (n, p) => `<div class="v-gb${p.Header ? '' : ' no-hdr'}"><div class="hdr">${esc(p.Header)}</div><div class="body"><div class="slot" data-owner="${n.id}" data-slot="0"></div></div></div>`,
    },
    TabControl: {
      label: 'TabControl', prefix: 'tabcontrol', size: [360, 240], container: true, slotsProp: 'Tabs', valueProp: 'SelectedIndex', defaultEvent: 'SelectionChanged',
      preset: { Tabs: 'Tab 1\nTab 2' },
      props: [P('Tabs', 'list', '', 'Common', { noXaml: true, hint: 'One tab header per line' }), P('SelectedIndex', 'number', 0, 'Common', { post: true })],
      events: ['SelectionChanged'],
      render: (n, p) => {
        const tabs = lines(p.Tabs);
        const a = n.activeSlot || 0;
        return `<div class="v-tc"><div class="strip">${tabs.map((t, i) => `<div class="tab-hdr${i === a ? ' on' : ''}" data-tab="${i}">${esc(t)}</div>`).join('')}</div><div class="body"><div class="slot" data-owner="${n.id}" data-slot="${a}"></div></div></div>`;
      },
    },
    Pages: {
      label: 'Pages (Wizard)', element: 'Panel', prefix: 'pages', size: [400, 260], container: true, slotsProp: 'Pages', defaultEvent: 'PointerPressed', noCommon: FONT_KEYS,
      preset: { Pages: 'Page 1\nPage 2\nPage 3' },
      props: [
        P('Pages', 'list', '', 'Common', { noXaml: true, hint: 'One page per line. Only one page is visible at run time. Switch pages from your script with Set-Page $pages1 -Next / -Previous / -Index n, and read the current page with Get-Page $pages1.' }),
        P('StartPage', 'number', 0, 'Common', { noXaml: true, hint: 'Index (0-based) of the page shown when the window opens.' }),
      ],
      events: [],
      render: (n, p) => {
        const pages = lines(p.Pages);
        const a = n.activeSlot || 0;
        return `<div class="v-pages"><div class="pg-nav" title="Design-time page switcher (not shown at run time)"><span class="pg-btn${a <= 0 ? ' dis' : ''}" data-page="${a - 1}">&#9664;</span><span>${a + 1}/${pages.length}: ${esc(pages[a] || '')}</span><span class="pg-btn${a >= pages.length - 1 ? ' dis' : ''}" data-page="${a + 1}">&#9654;</span></div><div class="slot" data-owner="${n.id}" data-slot="${a}"></div></div>`;
      },
    },
  };

  // Toolbox layout. Entries can pre-set properties of a type.
  const TOOLBOX = [
    {
      group: 'Common Controls',
      items: [
        { type: 'Button' },
        { type: 'TextBlock' },
        { type: 'TextBox' },
        { type: 'TextBox', label: 'Multiline TextBox', icon: 'TextBoxMulti', preset: { AcceptsReturn: true, TextWrapping: 'Wrap' }, size: [240, 100] },
        { type: 'TextBox', label: 'Password Box', icon: 'Password', preset: { PasswordChar: '*' }, prefix: 'password' },
        { type: 'CheckBox' },
        { type: 'RadioButton' },
        { type: 'ToggleButton' },
        { type: 'ToggleSwitch' },
        { type: 'HyperlinkButton' },
        { type: 'ComboBox' },
        { type: 'ListBox' },
        { type: 'DataGrid' },
      ],
    },
    {
      group: 'Values & Dates',
      items: [{ type: 'Slider' }, { type: 'ProgressBar' }, { type: 'NumericUpDown' }, { type: 'DatePicker' }, { type: 'CalendarDatePicker' }, { type: 'TimePicker' }],
    },
    { group: 'Containers', items: [{ type: 'Border' }, { type: 'GroupBox' }, { type: 'TabControl' }, { type: 'Pages' }] },
    { group: 'Menus', items: [{ type: 'Menu', label: 'Menu' }] },
  ];

  const LAYOUT_PROPS = [
    P('Left', 'number', 0, 'Layout', { bind: 'x' }),
    P('Top', 'number', 0, 'Layout', { bind: 'y' }),
    P('Width', 'number', 0, 'Layout', { bind: 'w' }),
    P('Height', 'number', 0, 'Layout', { bind: 'h' }),
    P('Anchor', 'anchor', 'Top, Left', 'Layout', {
      noXaml: true,
      hint: 'Edges of the parent the control stays attached to when the window (or its container) is resized. Left + Right stretches the width, Top + Bottom stretches the height; Right only moves it with the right edge.',
    }),
  ];

  /** All XAML-relevant property definitions of a control type (type + common). */
  function propsFor(type) {
    const t = TYPES[type];
    const own = new Set(t.props.map((p) => p.key));
    const common = COMMON_PROPS.filter((p) => !own.has(p.key) && !(t.noCommon || []).includes(p.key));
    return t.props.concat(common);
  }
  function eventsFor(type) {
    return TYPES[type].events.concat(COMMON_EVENTS.filter((e) => !TYPES[type].events.includes(e)));
  }

  /** Parse the menu text into a tree and assign unique item names. */
  function parseMenu(text) {
    const root = [];
    const stack = [{ indent: -1, children: root }];
    String(text || '').split(/\r?\n/).forEach((raw) => {
      if (!raw.trim()) return;
      const indent = raw.match(/^\s*/)[0].replace(/\t/g, '    ').length;
      const label = raw.trim();
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
      const item = { label, sep: /^-+$/.test(label), children: [] };
      stack[stack.length - 1].children.push(item);
      stack.push({ indent, children: item.children });
    });
    const used = new Set();
    const pascal = (s) => s.replace(/_/g, '').replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
    (function walk(items, path) {
      items.forEach((it) => {
        if (it.sep) return;
        const p = path.concat(pascal(it.label) || 'Item');
        let name = 'menu' + p.join('');
        let i = 2;
        while (used.has(name)) name = 'menu' + p.join('') + i++;
        used.add(name);
        it.name = name;
        walk(it.children, p);
      });
    })(root, []);
    return root;
  }
  function menuLeaves(tree) {
    const out = [];
    (function walk(items) {
      items.forEach((it) => {
        if (it.sep) return;
        out.push(it);
        walk(it.children);
      });
    })(tree);
    return out;
  }

  Object.assign(GC, { TYPES, TOOLBOX, COMMON_PROPS, COMMON_EVENTS, FORM_PROPS, FORM_EVENTS, MENU_PROPS, LAYOUT_PROPS, propsFor, eventsFor, parseMenu, menuLeaves, esc, lines, num, P });
})();
