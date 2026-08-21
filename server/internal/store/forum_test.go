package store

import (
	"strings"
	"testing"
	"unicode/utf8"
)

// slug 直接进 URL，也是帖子页 ISR 的缓存键——生成规则出错的代价是死链，
// 所以这些性质用测试钉住，不靠"看一眼觉得对"。
func TestNormalizeSlugKeepsOnlyASCII(t *testing.T) {
	cases := []struct{ name, in, want string }{
		{"ascii", "How to write a DSH plugin", "how-to-write-a-dsh-plugin"},
		// 带中文的路由段在 Next 的匹配里会 404，所以汉字必须和标点一样压成连字符；
		// 纯中文标题因此拿不到可读 slug，由 CreateThread 兜到 "t-<后缀>"。
		{"chinese drops out", "写 DSH 插件的三个坑", "dsh"},
		{"chinese only", "写插件的三个坑", ""},
		{"punctuation collapses", "Hello,   World!!! -- again", "hello-world-again"},
		{"trims edges", "--Hello--", "hello"},
		{"emoji only", "🎉🎉🎉", ""},
	}
	for _, tc := range cases {
		if got := NormalizeSlug(tc.in); got != tc.want {
			t.Errorf("%s: NormalizeSlug(%q) = %q, want %q", tc.name, tc.in, got, tc.want)
		}
	}
}

func TestNormalizeSlugIsBounded(t *testing.T) {
	got := NormalizeSlug(strings.Repeat("abcde ", 100))
	if n := utf8.RuneCountInString(got); n > threadSlugMaxChars {
		t.Errorf("slug 长度 %d 超过上限 %d", n, threadSlugMaxChars)
	}
	if strings.HasSuffix(got, "-") {
		t.Errorf("截断后留下了尾随连字符: %q", got)
	}
}

func TestRandomSuffixIsUnique(t *testing.T) {
	// 同名标题必须落到不同的 slug，否则第二篇文章发不出去
	first, err := randomSuffix()
	if err != nil {
		t.Fatal(err)
	}
	second, _ := randomSuffix()
	if first == second || len(first) != 8 {
		t.Errorf("后缀 = %q / %q", first, second)
	}
}

func TestPostableBoardsExcludePlugin(t *testing.T) {
	if IsPostableBoard(BoardPlugin) {
		t.Error("plugin 板不能手动发帖：讨论帖只由插件的首条评论建出来")
	}
	for _, board := range []string{BoardGeneral, BoardHelp, BoardDev, BoardAnnounce} {
		if !IsPostableBoard(board) {
			t.Errorf("%s 应该是可发帖板块", board)
		}
	}
	if IsPostableBoard("") || IsPostableBoard("../etc") {
		t.Error("空串与任意字符串都不该通过板块校验")
	}
}
