#!/usr/bin/env python3
"""
Generate character journey data for missing mirror characters.
Reads the canonical mirrorData.json catalogue and generates missing journey stops.
"""
import json
from pathlib import Path

# Common era→default location mapping
ERA_DEFAULTS = {
    "族长时代": "希伯仑",
    "出埃及/旷野": "西奈山",
    "士师时代": "示剑",
    "王国时代": "耶路撒冷",
    "王国分裂": "撒玛利亚",
    "被掳归回": "巴比伦",
    "两约之间": "耶路撒冷",
    "福音时代": "耶路撒冷",
    "教会时代": "罗马",
}

# Character-specific location mappings (name → list of {place, ref, event})
CHARACTER_STOPS = {
    "以诺": [{"place": "伊甸园", "ref": "创5:21-24", "event": "与神同行三百年，被神取去不经过死"}],
    "以挪士": [{"place": "伊甸园", "ref": "创4:26", "event": "塞特之子，开始求告耶和华的名"}],
    "宁录": [{"place": "巴比伦", "ref": "创10:8-12", "event": "地上英雄之首，在耶和华面前为猎户，建造巴别等城"}],
    "拉麦（挪亚之父）": [{"place": "伊甸园", "ref": "创5:28-31", "event": "挪亚之父，预言挪亚将安慰人类"}],
    "拉麦（该隐后裔）": [{"place": "伊甸园", "ref": "创4:19-24", "event": "该隐后裔，多妻并傲慢自夸复仇"}],
    "以实玛利": [{"place": "别是巴", "ref": "创16;21", "event": "亚伯拉罕与夏甲之子，旷野中的弓箭手，十二族之父"}],
    "便雅悯": [{"place": "耶路撒冷", "ref": "创35;42-45", "event": "雅各幼子，约瑟之弟，以色列十二支派之一"}],
    "伯沙撒": [{"place": "巴比伦", "ref": "但5", "event": "巴比伦末代王，宴饮亵渎圣殿器皿，当夜国亡"}],
    "亚达薛西": [{"place": "波斯", "ref": "拉7;尼2", "event": "波斯王亚达薛西，允准以斯拉、尼希米归回重建"}],
    "亚甲": [{"place": "撒玛利亚城", "ref": "撒上15", "event": "亚玛力王，扫罗违命不杀，被撒母耳处死"}],
    "哈曼": [{"place": "波斯", "ref": "斯3-7", "event": "亚甲族人，谋害犹太人，终被悬挂在自己所立的木架上"}],
    "以利亚实": [{"place": "耶路撒冷", "ref": "尼3;13", "event": "大祭司，带领重建城墙与圣殿，后被参巴拉联姻玷污"}],
    "参巴拉": [{"place": "撒玛利亚城", "ref": "尼2-6;13", "event": "撒玛利亚省长，阻挠尼希米建城，阴谋败露"}],
    "多比雅": [{"place": "撒玛利亚城", "ref": "尼2-6;13", "event": "亚扪人，参巴拉同党，阴谋破坏，后代与祭司联姻"}],
    "基善": [{"place": "耶路撒冷", "ref": "尼6", "event": "阿拉伯人，参巴拉同党，假意邀请谋害尼希米"}],
    "大利乌": [{"place": "波斯", "ref": "拉4-6;该1;亚1", "event": "波斯王大流士，批准圣殿重建，受先知哈该、撒迦利亚影响"}],
    "大坍与亚比兰": [{"place": "旷野", "ref": "民16", "event": "利未支派叛乱领袖，地开口吞灭，抗拒摩西亚伦"}],
    "可拉": [{"place": "旷野", "ref": "民16", "event": "利未人，聚集二百五十首领叛乱，被地吞灭"}],
    "亚比米勒": [{"place": "示剑", "ref": "士9", "event": "基甸之子，弑兄弟称王，被妇人的磨石砸死"}],
    "俄备得": [{"place": "伯利恒", "ref": "得4", "event": "波阿斯与路得之子，大卫之祖父"}],
    "基哈西": [{"place": "撒玛利亚城", "ref": "王下5;8", "event": "以利沙仆人，贪财患大麻风，欺骗先知"}],
    "乃缦": [{"place": "大马士革", "ref": "王下5", "event": "亚兰元帅，大麻风得洁净，唯独认识真神的外邦人"}],
    "撒勒法寡妇": [{"place": "撒勒法", "ref": "王上17", "event": "西顿寡妇，供养以利亚，儿子复活，信心的外邦人"}],
    "亚他利雅": [{"place": "耶路撒冷", "ref": "王下11;代下22-23", "event": "犹大女王，篡位六年，杀害王室后裔，终被耶何耶大推翻"}],
    "以太": [{"place": "耶路撒冷", "ref": "撒下15-18", "event": "大卫勇士，忠诚从大卫过约旦河，押沙龙叛乱中坚守"}],
    "户筛": [{"place": "耶路撒冷", "ref": "撒下15-17", "event": "大卫谋士，假装背叛打入押沙龙内部，破坏亚希多弗计谋"}],
    "乌利亚": [{"place": "耶路撒冷", "ref": "撒下11", "event": "赫人乌利亚，大卫勇士，因大卫奸淫拔示 Bathsheba 而被谋害"}],
    "拿八": [{"place": "迦密", "ref": "撒上25", "event": "迦密富户，刻薄吝啬，拒绝供应大卫，被神击打而死"}],
    "拿单": [{"place": "耶路撒冷", "ref": "撒下7;12;王上1", "event": "先知拿单，责备大卫，膏立所罗门，忠诚勇敢"}],
    "沙得拉": [{"place": "巴比伦", "ref": "但3", "event": "即哈拿尼雅，与米沙、亚伯尼歌同入火窑，敬拜真神"}],
    "亚伯尼歌": [{"place": "巴比伦", "ref": "但3", "event": "即亚撒利雅，火窑中得拯救，不屈膝拜偶像"}],
    "亚何利亚伯": [{"place": "西奈山", "ref": "出31;35;38", "event": "但支派巧匠，与比撒列同工建造会幕圣器"}],
    "户兰": [{"place": "推罗", "ref": "王上7;代下2-4", "event": "推罗巧匠，为所罗门圣殿制造铜器，半犹太血统"}],
    "户珥": [{"place": "西奈山", "ref": "出17;24;35", "event": "摩西亚伦助手，搀扶摩西举手，参与建造会幕"}],
    "法勒斯": [{"place": "伯利恒", "ref": "创38;太1", "event": "犹大与塔玛之子，孪生长子，入弥赛亚家谱"}],
    "他玛": [{"place": "希伯仑", "ref": "创38;太1", "event": "犹大儿媳，因公公不公而设局，生法勒斯，入弥赛亚家谱"}],
    "以伯米勒": [{"place": "耶路撒冷", "ref": "耶38", "event": "古实太监，拯救耶利米出淤泥坑，得神应许保全性命"}],
    "巴录": [{"place": "耶路撒冷", "ref": "耶32;36;45", "event": "耶利米文士，记录先知书卷，承受逼迫仍忠心"}],
    "歌利亚": [{"place": "以拉谷", "ref": "撒上17", "event": "非利士巨人，被大卫以投石击杀，倒在以拉谷"}],
    "拿伯": [{"place": "耶斯列", "ref": "王上21", "event": "耶斯列葡萄园主，因拒绝卖给亚哈而被耶洗别谋害"}],
    "以利以谢": [{"place": "大马士革", "ref": "创15", "event": "亚伯拉罕管家，若生子撒拉无出则继承，预表外邦人蒙恩"}],
    "夏甲": [{"place": "别是巴", "ref": "创16;21", "event": "撒拉使女，生以实玛利，被逐后在旷野蒙神看顾"}],
    "俄别以东": [{"place": "耶路撒冷", "ref": "撒下6;代上13;15", "event": "利未人，约柜停其家三月得大福，后代为圣殿乐师"}],
    "乌撒": [{"place": "耶路撒冷", "ref": "撒下6;代上13", "event": "触碰约柜被神击杀，警示不可轻慢神圣洁"}],
    "巴兰": [{"place": "毗珥", "ref": "民22-24;31", "event": "外邦先知，受雇咒诅以色列却祝福，终因引诱犯罪被杀"}],
    "歌篾": [{"place": "撒玛利亚城", "ref": "何1-3", "event": "先知何西阿之妻，象征以色列淫乱不忠，后被赎回"}],
    "宋尚节": [{"place": "北京", "ref": "1901-1944", "event": "中国布道家，化学博士弃职传道，被誉为「中国的慕迪」"}],
    "倪柝声": [{"place": "福州", "ref": "1903-1972", "event": "中国教会领袖，创办地方教会，写作《属灵人》等"}],
    "林献羔": [{"place": "北京", "ref": "1924-2013", "event": "中国家庭教会领袖，为主坐监多年，忠诚至死"}],
}

# Church era defaults for specific missionaries/reformers
CHURCH_LOCATIONS = {
    "奥古斯丁": [{"place": "希波", "ref": "354-430", "event": "希波主教，神学家，著有《忏悔录》《上帝之城》"}],
    "马丁·路德": [{"place": "维滕贝格", "ref": "1483-1546", "event": "宗教改革家，贴九十五条论纲，翻译德语圣经"}],
    "约翰·加尔文": [{"place": "日内瓦", "ref": "1509-1564", "event": "宗教改革家，著《基督教要义》，建立日内瓦教会体制"}],
    "约翰·卫斯理": [{"place": "伦敦", "ref": "1703-1791", "event": "卫理公会创始人，露天布道，循道运动领袖"}],
    "乔治·怀特菲尔德": [{"place": "伦敦", "ref": "1714-1770", "event": "大觉醒布道家，北美七次布道旅行"}],
    "约翰·班扬": [{"place": "贝德福德", "ref": "1628-1688", "event": "《天路历程》作者，狱中写作"}],
    "威廉·克里": [{"place": "塞兰坡", "ref": "1761-1834", "event": "现代宣教之父，印度宣教，翻译圣经"}],
    "威廉·丁道尔": [{"place": "安特卫普", "ref": "1494-1536", "event": "英译圣经先驱，被火刑殉道"}],
    "约翰·诺克斯": [{"place": "爱丁堡", "ref": "1514-1572", "event": "苏格兰宗教改革领袖，长老会创始人"}],
    "乔纳森·爱德华兹": [{"place": "北安普敦", "ref": "1703-1758", "event": "大觉醒神学家，著《宗教情操真伪辨》"}],
    "司布真": [{"place": "伦敦", "ref": "1834-1892", "event": "讲道王子，伦敦都会幕堂牧师"}],
    "慕迪": [{"place": "芝加哥", "ref": "1837-1899", "event": "美国布道家，创办慕迪圣经学院"}],
    "约翰·派博": [{"place": "明尼阿波利斯", "ref": "1946-", "event": "伯利恒神学院院长，著《渴慕神》"}],
    "提摩太·凯勒": [{"place": "纽约", "ref": "1950-2023", "event": "救赎主长老会创办人，著《为何是他》"}],
    "吉姆·艾略特": [{"place": "厄瓜多尔", "ref": "1927-1956", "event": "宣教士殉道者，被奥卡人杀害"}],
    "艾米·卡迈克尔": [{"place": "印度", "ref": "1867-1951", "event": "印度宣教士，拯救庙童，创办杜乃加尔之家"}],
    "哈德逊·泰勒": [{"place": "中国", "ref": "1832-1905", "event": "中国内地会创办人，深入中国内地宣教"}],
    "戴德生": [{"place": "中国", "ref": "1832-1905", "event": "中国内地会创办人，深入中国内地宣教"}],
}

# Add all church era characters to CHARACTER_STOPS
CHARACTER_STOPS.update(CHURCH_LOCATIONS)

def get_stops_for_char(name, era, ref):
    """Generate stops for a character based on name, era, and reference."""
    if name in CHARACTER_STOPS:
        return CHARACTER_STOPS[name]

    # Default handling based on era
    default_place = ERA_DEFAULTS.get(era, "耶路撒冷")
    return [{
        "place": default_place,
        "ref": ref or "圣经记载",
        "event": f"主要事奉地/活动地——{name}的事迹见{ref or '圣经'}"
    }]

def load_mirror_characters():
    catalogue = Path(__file__).resolve().parents[1] / 'src' / 'mirrorData.json'
    with catalogue.open(encoding='utf-8') as f:
        return json.load(f)['MIRROR_CHARACTERS']


def main():
    mirror_chars = load_mirror_characters()

    with open('/tmp/missing.txt', 'r', encoding='utf-8') as f:
        missing_names = [line.strip() for line in f if line.strip()]

    with open('data/characterJourneys.js', 'r', encoding='utf-8') as f:
        journey_content = f.read()

    # Find the end of CHARACTER_JOURNEYS object
    insert_pos = journey_content.rfind('}')
    if insert_pos == -1:
        print("Could not find insertion point")
        return

    new_entries = []
    for char in mirror_chars:
        name = char.get('name')
        if name not in missing_names:
            continue
        era = char.get('era', '')
        ref = char.get('ref', '')
        stops = get_stops_for_char(name, era, ref)

        stops_str = ',\n    '.join([
            f"{{ place: '{s['place']}', ref: '{s['ref']}', event: '{s['event']}' }}"
            for s in stops
        ])

        entry = f"  '{name}': {{ stops: [\n    {stops_str}\n  ]}}"
        new_entries.append(entry)

    # Insert before the final closing brace
    insert_text = ',\n' + ',\n'.join(new_entries)
    new_content = journey_content[:insert_pos] + insert_text + journey_content[insert_pos:]

    with open('data/characterJourneys.js', 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Added {len(new_entries)} new character journeys")
    print(f"Total characters now: {234 + len(new_entries)}")

if __name__ == '__main__':
    main()
