package httpapi

import (
	"fmt"
	"strconv"
	"strings"
	"unicode"
)

type graphDocument struct {
	operations []graphOperation
	fragments  map[string][]graphField
}

type graphOperation struct {
	kind      string
	name      string
	selection []graphField
}

type graphField struct {
	alias           string
	name            string
	args            map[string]any
	selection       []graphField
	spreadName      string
	inlineSelection []graphField
}

func (f graphField) responseKey() string {
	if f.alias != "" {
		return f.alias
	}
	return f.name
}

func (d *graphDocument) operation(name string) (*graphOperation, error) {
	if name != "" {
		for i := range d.operations {
			if d.operations[i].name == name {
				return &d.operations[i], nil
			}
		}
		return nil, fmt.Errorf("operation %q was not found", name)
	}
	if len(d.operations) != 1 {
		return nil, fmt.Errorf("operationName is required when a document has multiple operations")
	}
	return &d.operations[0], nil
}

func (d *graphDocument) expand(fields []graphField, stack map[string]bool) ([]graphField, error) {
	var out []graphField
	for _, field := range fields {
		if field.inlineSelection != nil {
			expanded, err := d.expand(field.inlineSelection, stack)
			if err != nil {
				return nil, err
			}
			out = append(out, expanded...)
			continue
		}
		if field.spreadName == "" {
			out = append(out, field)
			continue
		}
		if stack == nil {
			stack = map[string]bool{}
		}
		if stack[field.spreadName] {
			return nil, fmt.Errorf("fragment %q is recursive", field.spreadName)
		}
		fragment, ok := d.fragments[field.spreadName]
		if !ok {
			return nil, fmt.Errorf("fragment %q was not found", field.spreadName)
		}
		stack[field.spreadName] = true
		expanded, err := d.expand(fragment, stack)
		delete(stack, field.spreadName)
		if err != nil {
			return nil, err
		}
		out = append(out, expanded...)
	}
	return out, nil
}

type graphVariable struct{ name string }

func resolveGraphValue(value any, variables map[string]any) (any, error) {
	switch v := value.(type) {
	case graphVariable:
		resolved, ok := variables[v.name]
		if !ok {
			return nil, fmt.Errorf("variable $%s was not supplied", v.name)
		}
		return resolved, nil
	case []any:
		out := make([]any, len(v))
		for i := range v {
			resolved, err := resolveGraphValue(v[i], variables)
			if err != nil {
				return nil, err
			}
			out[i] = resolved
		}
		return out, nil
	case map[string]any:
		out := make(map[string]any, len(v))
		for key, child := range v {
			resolved, err := resolveGraphValue(child, variables)
			if err != nil {
				return nil, err
			}
			out[key] = resolved
		}
		return out, nil
	default:
		return value, nil
	}
}

type graphTokenKind uint8

const (
	graphEOF graphTokenKind = iota
	graphName
	graphString
	graphInt
	graphPunct
	graphSpread
)

type graphToken struct {
	kind graphTokenKind
	text string
	pos  int
}

type graphParser struct {
	tokens []graphToken
	index  int
}

func parseGraphDocument(input string) (*graphDocument, error) {
	tokens, err := lexGraph(input)
	if err != nil {
		return nil, err
	}
	p := graphParser{tokens: tokens}
	doc := &graphDocument{fragments: map[string][]graphField{}}
	for p.peek().kind != graphEOF {
		tok := p.peek()
		if tok.kind == graphPunct && tok.text == "{" {
			selection, err := p.parseSelectionSet(1)
			if err != nil {
				return nil, err
			}
			doc.operations = append(doc.operations, graphOperation{kind: "query", selection: selection})
			continue
		}
		if tok.kind != graphName {
			return nil, p.errorf("expected operation or fragment")
		}
		switch tok.text {
		case "query", "mutation", "subscription":
			op, err := p.parseOperation()
			if err != nil {
				return nil, err
			}
			doc.operations = append(doc.operations, op)
		case "fragment":
			if err := p.parseFragment(doc); err != nil {
				return nil, err
			}
		default:
			return nil, p.errorf("expected query, mutation, subscription, or fragment")
		}
	}
	if len(doc.operations) == 0 {
		return nil, fmt.Errorf("document must contain an operation")
	}
	return doc, nil
}

func (p *graphParser) parseOperation() (graphOperation, error) {
	kind := p.next().text
	op := graphOperation{kind: kind}
	if p.peek().kind == graphName {
		op.name = p.next().text
	}
	if p.peek().kind == graphPunct && p.peek().text == "(" {
		if err := p.skipBalanced("(", ")"); err != nil {
			return graphOperation{}, err
		}
	}
	if p.peek().kind == graphPunct && p.peek().text == "@" {
		return graphOperation{}, p.errorf("directives are not supported")
	}
	selection, err := p.parseSelectionSet(1)
	if err != nil {
		return graphOperation{}, err
	}
	op.selection = selection
	return op, nil
}

func (p *graphParser) parseFragment(doc *graphDocument) error {
	p.next() // fragment
	name, err := p.expectName()
	if err != nil {
		return err
	}
	if _, err := p.expectNameText("on"); err != nil {
		return err
	}
	if _, err := p.expectName(); err != nil { // type condition: schema controls valid fields.
		return err
	}
	selection, err := p.parseSelectionSet(1)
	if err != nil {
		return err
	}
	if _, exists := doc.fragments[name]; exists {
		return p.errorf("fragment %q is defined more than once", name)
	}
	doc.fragments[name] = selection
	return nil
}

func (p *graphParser) parseSelectionSet(depth int) ([]graphField, error) {
	if depth > maxGraphQLDepth {
		return nil, p.errorf("query exceeds maximum depth of %d", maxGraphQLDepth)
	}
	if err := p.expectPunct("{"); err != nil {
		return nil, err
	}
	fields := []graphField{}
	for {
		if p.peek().kind == graphEOF {
			return nil, p.errorf("unterminated selection set")
		}
		if p.peek().kind == graphPunct && p.peek().text == "}" {
			p.next()
			return fields, nil
		}
		field, err := p.parseField(depth)
		if err != nil {
			return nil, err
		}
		fields = append(fields, field)
	}
}

func (p *graphParser) parseField(depth int) (graphField, error) {
	if p.peek().kind == graphSpread {
		p.next()
		if p.peek().kind == graphName && p.peek().text == "on" {
			p.next()
			if _, err := p.expectName(); err != nil {
				return graphField{}, err
			}
			selection, err := p.parseSelectionSet(depth + 1)
			if err != nil {
				return graphField{}, err
			}
			// 内联 fragment 可直接展开；同类型验证仍由具体对象 field resolver 完成。
			return graphField{inlineSelection: selection}, nil
		}
		name, err := p.expectName()
		if err != nil {
			return graphField{}, err
		}
		return graphField{spreadName: name}, nil
	}
	name, err := p.expectName()
	if err != nil {
		return graphField{}, err
	}
	field := graphField{name: name}
	if p.peek().kind == graphPunct && p.peek().text == ":" {
		p.next()
		field.alias = name
		field.name, err = p.expectName()
		if err != nil {
			return graphField{}, err
		}
	}
	if p.peek().kind == graphPunct && p.peek().text == "(" {
		args, err := p.parseArguments()
		if err != nil {
			return graphField{}, err
		}
		field.args = args
	}
	if p.peek().kind == graphPunct && p.peek().text == "@" {
		return graphField{}, p.errorf("directives are not supported")
	}
	if p.peek().kind == graphPunct && p.peek().text == "{" {
		field.selection, err = p.parseSelectionSet(depth + 1)
		if err != nil {
			return graphField{}, err
		}
	}
	return field, nil
}

func (p *graphParser) parseArguments() (map[string]any, error) {
	if err := p.expectPunct("("); err != nil {
		return nil, err
	}
	args := map[string]any{}
	for {
		if p.peek().kind == graphPunct && p.peek().text == ")" {
			p.next()
			return args, nil
		}
		name, err := p.expectName()
		if err != nil {
			return nil, err
		}
		if _, exists := args[name]; exists {
			return nil, p.errorf("argument %q appears more than once", name)
		}
		if err := p.expectPunct(":"); err != nil {
			return nil, err
		}
		value, err := p.parseValue()
		if err != nil {
			return nil, err
		}
		args[name] = value
	}
}

func (p *graphParser) parseValue() (any, error) {
	tok := p.next()
	switch tok.kind {
	case graphString:
		return tok.text, nil
	case graphInt:
		value, err := strconv.Atoi(tok.text)
		if err != nil {
			return nil, p.errorf("invalid integer")
		}
		return value, nil
	case graphName:
		switch tok.text {
		case "true":
			return true, nil
		case "false":
			return false, nil
		case "null":
			return nil, nil
		default:
			return tok.text, nil // enum values are represented as strings.
		}
	case graphPunct:
		switch tok.text {
		case "$":
			name, err := p.expectName()
			if err != nil {
				return nil, err
			}
			return graphVariable{name: name}, nil
		case "[":
			return p.parseListValue()
		case "{":
			return p.parseObjectValue()
		}
	}
	return nil, p.errorf("expected a GraphQL value")
}

func (p *graphParser) parseListValue() ([]any, error) {
	values := []any{}
	for {
		if p.peek().kind == graphPunct && p.peek().text == "]" {
			p.next()
			return values, nil
		}
		value, err := p.parseValue()
		if err != nil {
			return nil, err
		}
		values = append(values, value)
	}
}

func (p *graphParser) parseObjectValue() (map[string]any, error) {
	object := map[string]any{}
	for {
		if p.peek().kind == graphPunct && p.peek().text == "}" {
			p.next()
			return object, nil
		}
		name, err := p.expectName()
		if err != nil {
			return nil, err
		}
		if _, exists := object[name]; exists {
			return nil, p.errorf("input field %q appears more than once", name)
		}
		if err := p.expectPunct(":"); err != nil {
			return nil, err
		}
		value, err := p.parseValue()
		if err != nil {
			return nil, err
		}
		object[name] = value
	}
}

func (p *graphParser) skipBalanced(open, close string) error {
	if err := p.expectPunct(open); err != nil {
		return err
	}
	depth := 1
	for depth > 0 {
		tok := p.next()
		if tok.kind == graphEOF {
			return p.errorf("unterminated %s", open)
		}
		if tok.kind != graphPunct {
			continue
		}
		switch tok.text {
		case open:
			depth++
		case close:
			depth--
		}
	}
	return nil
}

func (p *graphParser) expectName() (string, error) {
	tok := p.next()
	if tok.kind != graphName {
		return "", p.errorf("expected a name")
	}
	return tok.text, nil
}

func (p *graphParser) expectNameText(want string) (string, error) {
	name, err := p.expectName()
	if err != nil || name != want {
		if err != nil {
			return "", err
		}
		return "", p.errorf("expected %q", want)
	}
	return name, nil
}

func (p *graphParser) expectPunct(want string) error {
	tok := p.next()
	if tok.kind != graphPunct || tok.text != want {
		return p.errorf("expected %q", want)
	}
	return nil
}

func (p *graphParser) peek() graphToken {
	if p.index >= len(p.tokens) {
		return graphToken{kind: graphEOF}
	}
	return p.tokens[p.index]
}

func (p *graphParser) next() graphToken {
	tok := p.peek()
	if p.index < len(p.tokens) {
		p.index++
	}
	return tok
}

func (p *graphParser) errorf(format string, args ...any) error {
	return fmt.Errorf("GraphQL parse error near byte %d: %s", p.peek().pos, fmt.Sprintf(format, args...))
}

func lexGraph(input string) ([]graphToken, error) {
	tokens := make([]graphToken, 0, len(input)/4)
	for pos := 0; pos < len(input); {
		ch := input[pos]
		if isGraphWhitespace(ch) || ch == ',' {
			pos++
			continue
		}
		if ch == '#' {
			for pos < len(input) && input[pos] != '\n' && input[pos] != '\r' {
				pos++
			}
			continue
		}
		if isGraphNameStart(ch) {
			start := pos
			pos++
			for pos < len(input) && isGraphNameContinue(input[pos]) {
				pos++
			}
			tokens = append(tokens, graphToken{kind: graphName, text: input[start:pos], pos: start})
			continue
		}
		if ch == '-' || (ch >= '0' && ch <= '9') {
			start := pos
			pos++
			for pos < len(input) && input[pos] >= '0' && input[pos] <= '9' {
				pos++
			}
			tokens = append(tokens, graphToken{kind: graphInt, text: input[start:pos], pos: start})
			continue
		}
		if ch == '"' {
			start := pos
			if strings.HasPrefix(input[pos:], `"""`) {
				return nil, fmt.Errorf("GraphQL parse error near byte %d: block strings are not supported", pos)
			}
			pos++
			escaped := false
			for pos < len(input) {
				current := input[pos]
				pos++
				if escaped {
					escaped = false
					continue
				}
				if current == '\\' {
					escaped = true
					continue
				}
				if current == '"' {
					decoded, err := strconv.Unquote(input[start:pos])
					if err != nil {
						return nil, fmt.Errorf("GraphQL parse error near byte %d: invalid string", start)
					}
					tokens = append(tokens, graphToken{kind: graphString, text: decoded, pos: start})
					break
				}
			}
			if len(tokens) == 0 || tokens[len(tokens)-1].pos != start {
				return nil, fmt.Errorf("GraphQL parse error near byte %d: unterminated string", start)
			}
			continue
		}
		if strings.HasPrefix(input[pos:], "...") {
			tokens = append(tokens, graphToken{kind: graphSpread, text: "...", pos: pos})
			pos += 3
			continue
		}
		if strings.ContainsRune("!$():=@[]{|}&", rune(ch)) {
			tokens = append(tokens, graphToken{kind: graphPunct, text: string(ch), pos: pos})
			pos++
			continue
		}
		return nil, fmt.Errorf("GraphQL parse error near byte %d: unexpected character %q", pos, ch)
	}
	return append(tokens, graphToken{kind: graphEOF, pos: len(input)}), nil
}

func isGraphWhitespace(ch byte) bool {
	return ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r'
}

func isGraphNameStart(ch byte) bool {
	return ch == '_' || unicode.IsLetter(rune(ch))
}

func isGraphNameContinue(ch byte) bool {
	return isGraphNameStart(ch) || (ch >= '0' && ch <= '9')
}
