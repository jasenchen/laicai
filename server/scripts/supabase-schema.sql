-- industries
create table if not exists public.industries (
  id text primary key,
  primary_category text not null,
  secondary_category text,
  level int not null,
  sort_order int not null
);

-- user_phones
create table if not exists public.user_phones (
  uid text primary key,
  phone text not null,
  dosage int not null default 10,
  resettime timestamptz,
  updatedAt timestamptz,
  industry jsonb
);
create unique index if not exists user_phones_phone_idx on public.user_phones (phone);

-- user_generations
create table if not exists public.user_generations (
  id bigint generated always as identity primary key,
  uid text not null,
  prompt text not null,
  ref_img text,
  g_imgurl1 text,
  g_imgurl2 text,
  g_imgurl3 text,
  g_imgurl4 text,
  download_img text,
  createdAt timestamptz,
  updatedAt timestamptz
);
create index if not exists user_generations_uid_created_idx on public.user_generations (uid, createdAt desc);

-- haibao-generation-tab (建议：使用 snake_case haibao_generation_tab 以避免 REST 引号问题)
create table if not exists public."haibao-generation-tab" (
  "tab-name" text primary key,
  num int not null,
  "tab-pre" text,
  "tab-cankao-sys" text,
  "tab-cankao-user" text,
  "tab-prompt" text,
  "tab-placeholder" text
);

create table if not exists public.haibao_generation_tab (
  tab_name text primary key,
  num int not null,
  tab_pre text,
  tab_cankao_sys text,
  tab_cankao_user text,
  tab_prompt text,
  tab_placeholder text
);

-- 初始化 haibao-generation-tab 表数据
insert into public."haibao-generation-tab" ("num", "tab-name", "tab-pre", "tab-cankao-sys", "tab-cankao-user", "tab-prompt", "tab-placeholder") values
  (
    0,
    '品质海报',
    'https://twgrphjkqbqbrdtlcnvz.supabase.co/storage/v1/object/public/laicai-01/haibao/tab-pre-pinzhihaibao.png',
    'https://twgrphjkqbqbrdtlcnvz.supabase.co/storage/v1/object/public/laicai-01/haibao/cankao-sys-pinzhihaibao.jpg',
    'https://twgrphjkqbqbrdtlcnvz.supabase.co/storage/v1/object/public/laicai-01/haibao/cankao-user-pinzhihaipao.png',
    '优化图二的主体菜品，放到图一并使风格融合，透视和谐；{dynamicContent}，根据图二的菜品主体进行联想并更改文案（包括底部绿色区域文案及标题），注重光影效果，突出主体，营造出极具食欲的氛围',
    '请输入菜品名，如：锅包肉、红烧肉、麻婆豆腐等'
  ),
  (
    1,
    '趣味图文',
    'https://twgrphjkqbqbrdtlcnvz.supabase.co/storage/v1/object/public/laicai-01/haibao/tab-pre-quweituwen.jpg',
    'https://twgrphjkqbqbrdtlcnvz.supabase.co/storage/v1/object/public/laicai-01/haibao/cankao-sys-quweituwen.jpg',
    'https://twgrphjkqbqbrdtlcnvz.supabase.co/storage/v1/object/public/laicai-01/haibao/cankao-user-quweituwen.jpg',
    '优化图2的主体菜品，保持图2主体一致性，仅将图2菜品主体放到图1并使风格融合，透视和谐；识别图2的主体，{拼接文本}注重光影效果，突出主体，营造出极具食欲的氛围',
    '输入海报标题，如：外卖只需30分钟、美味甘肃麻辣烫等'
  ),
  (
    2,
    '招牌特写',
    'https://twgrphjkqbqbrdtlcnvz.supabase.co/storage/v1/object/public/laicai-01/haibao/tab-pre-zhaopaitexie.jpg',
    'https://twgrphjkqbqbrdtlcnvz.supabase.co/storage/v1/object/public/laicai-01/haibao/cankao-sys-zhaopaitexie.jpeg',
    'https://twgrphjkqbqbrdtlcnvz.supabase.co/storage/v1/object/public/laicai-01/haibao/cankao-user-quweituwen.jpg',
    '优化图2的主体菜品，保持图2主体一致性，仅将图2菜品主体放到图1并使风格融合，透视和谐；识别图2的主体，{拼接文本}注重光影效果，突出主体，营造出极具食欲的氛围',
    '输入海报标题，如：外卖只需30分钟、美味甘肃麻辣烫等'
  ),
  (
    3,
    '节日场景',
    'https://twgrphjkqbqbrdtlcnvz.supabase.co/storage/v1/object/public/laicai-01/haibao/tab-pre-jierichangjing.png',
    'https://twgrphjkqbqbrdtlcnvz.supabase.co/storage/v1/object/public/laicai-01/haibao/cankao-sys-jierichangjing.jpg',
    'https://twgrphjkqbqbrdtlcnvz.supabase.co/storage/v1/object/public/laicai-01/haibao/cankao-user-jierichangjing.jpg',
    '优化图2的主体花束，造型不变，放到图1的偏左下并使风格融合，占比画面的2/5，透视和谐；左上角有花材虚化，营造柔和暖光效果；花器置于原木切片底座上，周围散落花瓣，细节温馨，花束右侧投下柔和花影，增强空间感与氛围。增强自然与温馨感。光线柔和，花束细节清晰，虚化花材和花影营造浪漫氛围。识别图1的主体花束花语，并根据图2的花束及花语进行联想并更改文案，主标题使用英文，副标题使用中文，',
    '输入节日促销文案'
  );
