---
title: Spacy Relation Extraction
date: "2021-05-01"
description: "Using Spacy to extract relations from unstructured text"
---

In this post you will learn, how to extract relations from text, using 
<a href="https://spacy.io/">Spacy</a>. Relations are useful for extracting structured information, from an unstructured
text source such as a book a wikipedia article, or a <a href="">Blog Post</a>. Relations are
triples of the form (Entity, Action, Entity).

Examples include, (Sean, runs to, mall), (Gandalf, shall not, pass), (the dog, flies at, midnight).

## PreRequistes

The code in this post uses Spacy and Python 3. Spacy
is an easy to use NLP (Natural Language Processing) library. I liked it for
its simplicity and its lack of choice in algorithms, which for somebody who knows
nothing about NLP, is a good thing.

The entire code base can be found at the public github repo: <a href="https://github.com/seadavis/StoryNode">StoryNode</a>.

The algorithm I chose to use comes from a paper called; <a href="http://reverb.cs.washington.edu/emnlp11.pdf">Identifying Relations for Open Information Extraction</a>. Yes, they do have an open source project, 
but it wasn't quite what I needed and it didn't mesh well with Spacy out of the box, which I'll need for
the next phase of my project. Besides the algorithm itself is actually suprisingly easy to implement.

## Relation and Examples

There are much fancier words for each element of the relation, but I prefer to think
of them as the left-phrase, relation-phrase and the right phrase. I prefer this naming because,
the left and right phrases can be nouns, references to dates, proper nouns, really
any type of entity. The relation-phrase is really just some adjective and usually some kind of 
a filler word such as in, or to.

Before we get into the nitty gritty details of the algorithm I'll show a few
example sentences and the corresponding relations we are after.

The first example comes from Obama's wikipedia entry. The second example comes from a Jane Austen novel,
thanks to <a href="https://www.gutenberg.org/">project gutenberg</a>, a wonderful site with free e-books.

<b>Example One:</b> In July 2012, Ancestry.com found a strong likelihood that Dunham was descended from John Punch

<b>Example One's First Relation:</b> (Ancestry.com, found a strong, likelihood)
<b>Example One's Second Relation:</b> (Dunham, descended from, John)

<b>Example Two:</b> Elizabeth was glad to be taken to her immediately
<b>Example Two's Relation:</b> (Elizabeth, taken to, her)"

All of these examples can be found under the folder <a href="https://github.com/seadavis/StoryNode/tree/main/Text_Examples">Text_Examples</a> in the github project.

## Interface

The following snippet, shows the interface we are aiming for to extract relations and is taken from <a href="https://github.com/seadavis/StoryNode/blob/main/Tests/test_relation_extraction.py">Tests\test_relation_extraction.py</a>

```python
 def test_multiple_examples():
    doc = Document("In July 2012, Ancestry.com found a strong likelihood that Dunham was descended from John Punch")
    relations = extract_relations(doc)
    assert str(relations[0]) == "(Ancestry.com, found a strong, likelihood)"
    assert str(relations[1]) == "(Dunham, descended from, John)
```

## Data Structures

There are just three Data Structures required to make this work. A Document, a Relation and a TextSpan.

A Document is just an object I use to wrap the spacy analysis for both perfomance 
and ease of use reasons. Essentially it just does:

```python
    nlp = spacy.load("en_core_web_sm")
    doc = nlp(text)
```

The first line tells Spacy to load the english language, the second line tells Spacy
to do its analysis on the given text object.

Relations are objects with the following definition:

```python
class Relation:

    def __init__(self, left_phrase, relation_phrase, right_phrase):
        """Constructs a relation of the form
        (left_phrase, relation_phrase, right_phrase)

        Examples:
        (Sean, runs to, mall), 
        (Gandalf, shall not, pass), 
        (the dog, flies, at midnight)

        Args:
            left_phrase (TextSpan): the leftside phrse
            relation_phrase (TextSpan): the relation phrase
            right_phrase (TextSpan): the right-side phrase of the relation
        """
        self.left_phrase = left_phrase
        self.relation_phrase = relation_phrase
        self.right_phrase = right_phrase
```

A Text span, is a portion of the original text that wraps the spans from space into just 
the components needed for relation extraction with the following definition:

```python
class TextSpan:

    def __init__(self, sentence, start_index, end_index):
        self.sentence = sentence
        self.start_index = start_index
        self.end_index = end_index
```

As an example of what I mean when I refer to a spacy span, the following snippet can be found in the GitHub project under StoryNode\CodeExamples\pattern_matches.py

```python
    matches = matcher(doc)
    for match_id, start, end in matches:
        string_id = nlp.vocab.strings[match_id]  # Get string representation
        span = doc[start:end]  # The matched span
        print(match_id, string_id, start, end, span.text)
```

## Algorithm

The algorithm has four basic steps
1) Find all of the verbs in a document.
2) Find the longest pattern that matches some constraint (referred to as a syntactical constraint in the paper) merging
overlapping or consecutive matches.
3) For each verb find the closest Noun that comes before the pattern found in step 2 (left-phrase)
4) For each verb find the closest Noun that comes after the pattern found in step 2 (right-phrase)

The actual algorithm in the paper had another component (lexical constraint) I chose to ignore, because 
for my purposes this is close enough.

In Python this algorithm looks like:

```python
for verb in verbs:
        verb_spans = [span for span in syntactical_constraint_matches if verb in span.sentence]
        joined_spans = merge_overlapping_consecutive_word_span(verb_spans)
        longest_span = find_longest_span(joined_spans)
        relation_spans.append(longest_span)
```

Where the verbs are found using Spacy's <a href="https://spacy.io/usage/rule-based-matching">pattern matching</a> capabilities. The more interesting pattern is the synactical constraint, which
after reading the paper and some experimentation I found to be,

```python
[[{"POS":"VERB"}, {"POS": "PART", "OP": "*"}, {"POS": "ADV", "OP":"*"}], 
                        [{"POS": "VERB"},  {"POS": "ADP", "OP": "*"}, {"POS": "DET", "OP":"*"},
                        {"POS": "AUX", "OP": "*"},  
                        {"POS": "ADJ", "OP":"*"}, {"POS": "ADV", "OP": "*"}]]
```

The patterns work very similar to how regular expression works where '*', means match zero or more times. In here there are two arrays,
which tells spacy to match either one.

So either we match a Verb follow by a participle follow by an adverb or we match a verb follow by an adposition (in, to, during etc.), auxillary (the, an) an adjective, and an adverb.

For finding the longest span we simply use:

```python
def find_longest_span(text_spans):
    """find the longest match

    Args:
        text_spans ([TextSpan]): the set of matches we are filtering
    """
    if len(text_spans) == 0:
        return None

    sorted_spans = sorted(text_spans, key=lambda s: s.length, reverse=True)
    return sorted_spans[0]
```

Merging consecutive and overlapping spans is perhaps the trickest bit. But the heart of the algorithm is to 

1) Merge spans that are consecutive, or in other words if the end index of a span, plus one is equal to the start index of another span. Keeping track of which indices are going to
be removed so we don't calculate them twice. Like so:

```python

    if span.end_index + 1 == next_span.start_index:
        removal_indices.append(next_index)
        merged_cons_spans.append(TextSpan(span.sentence + " " + next_span.sentence, span.start_index, next_span.end_index))
    else:
        merged_cons_spans.append(span)

```

2) Merge overlapping text spans. All of the spans in the following explanation are from the sentence; "Sean is writing a blog on a saturday".

First we sort the spans by start index. This allows us to know, before doing the comparisons that the start index of the second span is at least the start index of the first span.

The first case to handle is when one span is contained entirely inside of another span. For example, "is writing a blog", contains the span "a blog". We want to merge these two spans to become "is writing a blog". 

The python code to accomplish this is:
```python
     if span_2.start_index <= span_1.end_index and span_2.end_index <= span_1.end_index:
        return span_1
```

The second case is when the second span is not entirely contained in the first span. For example, "is writing a blog" and the span "writing a blog on a". This case is handled with:

```python
elif span_2.start_index <= span_1.end_index:

    relative_span_1_end = span_1.end_index - span_2.start_index
    span_2_words = span_2.sentence.split()
    remaining_words = span_2_words[(relative_span_1_end):len(span_2_words)]
    entire_string = " ".join(remaining_words)
    return TextSpan(span_1.sentence + " " + entire_string, span_1.start_index, span_2.end_index)
```

## Results

The following results can be obtained by running the command: python relation_extraction.py Text_Examples/Test_Sentences.txt, 
from the root directory of StoryNode.

Original Text: Sean, is going to the mall
Relation: (Sean, going to the, mall)

Original Text: Rochelle enjoy's candy
Relation: (Rochelle, enjoy , candy)

Original Text: She was shown into the breakfast-parlour
Relation: (She, shown into the, breakfast)

Original Text: her appearance created a great deal of surprise
Relation: (appearance, created a great, deal)

Original Text: She was received, however, very politely by them
Relation: (She, received, them)

Original Text: When the clock struck three, Elizabeth felt that she must go, and very unwillingly said so
Relation: (clock, struck, Elizabeth)
Relation: (Elizabeth, felt, she)

Original Text: Obama was born on August 4, 1961, at Kapiolani Medical Center for Women and Children in Honolulu, Hawaii.
Relation: (Obama, born on, August)

Original Text: He was born to an American mother of European descent and an African father
Relation: (He, born to an American, mother)

Original Text: In July 2012, Ancestry.com found a strong likelihood that Dunham was descended from John Punch
Relation: (Ancestry.com, found a strong, likelihood)
Relation: (Dunham, descended from, John)

Original Text: Barack Obama Sr. (1936–1982), was a married Luo Kenyan from Nyang'oma Kogelo

As you can see, this works fairly well finding most relations.

## Conclusion

And that's all there is to it. With a few hundred lines of code, you too can implement relation extraction.