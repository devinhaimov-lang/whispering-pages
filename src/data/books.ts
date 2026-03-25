import coverMozheng from "@/assets/cover-mozheng.jpg";
import coverMirror from "@/assets/cover-mirror.jpg";
import coverBamboo from "@/assets/cover-bamboo.jpg";
import coverDragon from "@/assets/cover-dragon.jpg";
import coverMedicine from "@/assets/cover-medicine.jpg";
import coverGuqin from "@/assets/cover-guqin.jpg";
import { chapters as mozhengChapters } from "./novel";

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  cover: string;
  description: string;
  tags: string[];
  chapterCount: number;
  status: "连载中" | "已完结" | "即将上线";
  hasContent: boolean;
}

export const books: Book[] = [
  {
    id: "mozheng",
    title: "莫争·故事集",
    subtitle: "志怪录·卷一",
    author: "佚名",
    cover: coverMozheng,
    description: "采药人莫争于青岚山中救下一只受伤白狐，自此卷入一段人妖纠葛。白狐化形为苏灵儿，知恩图报，却也将莫争引入一个更深的漩涡之中。",
    tags: ["志怪", "人妖恋", "山野奇谈"],
    chapterCount: mozhengChapters.length,
    status: "连载中",
    hasContent: true,
  },
  {
    id: "mirror",
    title: "照妖铜鉴",
    subtitle: "志怪录·卷二",
    author: "佚名",
    cover: coverMirror,
    description: "一面出土的古铜镜，照出的不是人的面容，而是他们心中藏匿的妖影。持镜者一个接一个地疯狂，只有最后一个盲人，看到了真相。",
    tags: ["悬疑", "古物志怪", "心魔"],
    chapterCount: 5,
    status: "即将上线",
    hasContent: false,
  },
  {
    id: "bamboo",
    title: "竹林夜话",
    subtitle: "志怪录·卷三",
    author: "佚名",
    cover: coverBamboo,
    description: "书生夜行竹林，遇一提灯老者。老者说，这片竹林里的每一根竹子，都曾经是一个活生生的人。书生不信，折断一根——竹中流出了鲜血。",
    tags: ["惊悚", "竹林", "因果轮回"],
    chapterCount: 4,
    status: "即将上线",
    hasContent: false,
  },
  {
    id: "dragon",
    title: "化龙吟",
    subtitle: "志怪录·卷四",
    author: "佚名",
    cover: coverDragon,
    description: "千年锦鲤修行将满，只差最后一道雷劫便可化龙。然而它爱上了岸边浣衣的女子，甘愿放弃龙身，化为凡人。可凡人的寿命，只有一瞬。",
    tags: ["凄美", "化龙", "人鱼之恋"],
    chapterCount: 6,
    status: "即将上线",
    hasContent: false,
  },
  {
    id: "medicine",
    title: "百草堂异闻",
    subtitle: "志怪录·卷五",
    author: "佚名",
    cover: coverMedicine,
    description: "城东百草堂的老掌柜已经活了三百年，没有人知道他的秘密。每到月圆之夜，药堂后院的珠帘后面，总会传出不属于人间的低语。",
    tags: ["都市志怪", "药铺", "长生"],
    chapterCount: 7,
    status: "即将上线",
    hasContent: false,
  },
  {
    id: "guqin",
    title: "断弦泪",
    subtitle: "志怪录·卷六",
    author: "佚名",
    cover: coverGuqin,
    description: "桥上女子夜夜抚琴，琴声可令百鬼退散。直到有一夜，一个少年驻足聆听——她的弦，便再也弹不响了。因为她等的人，终于来了。",
    tags: ["古琴", "幽魂", "等待"],
    chapterCount: 5,
    status: "即将上线",
    hasContent: false,
  },
];
