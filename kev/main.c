#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// keys : strings
// values : strings
// GET / PUT / KEYS request
// DEL write a tombstone

typedef struct List {
  char* key;
  char* value;
  struct List* tail;
} List;

char* lookup(List* store, char* key) {
  List* p = store;
  while (p != NULL) {
    if (strcmp(p->key, key) == 0) {
      return p->value;
    }
    p = p->tail;
  }

  return NULL;
}

int contains(List* store, char* key) {
  List* p = store;
  while (p != NULL) {
    if (strcmp(p->key, key) == 0) {
      return 1;
    }
    p = p->tail;
  }

  return 0;
}

List* prepend(char* key, char* value, List* store) {
  List* tmp = malloc(sizeof(List));
  tmp->key = key;
  tmp->value = value;
  tmp->tail = store;
  return tmp;
}

int main () {

  List* store = NULL;

  size_t len = 10;
  char* line = (char*) malloc(len);

  setbuf(stdout, NULL);

  while (getline(&line, &len, stdin) != -1) {
    if (strncmp(line, "KEYS\n", len) == 0) {
      List* seen = NULL;

      List* p = store;
      while (p != NULL) {
        if (!contains(seen, p->key)) {
          seen = prepend(p->key, p->value, seen);
        }
        p = p->tail;
      }

      p = seen;
      while (p != NULL) {
        if (p->value != NULL) {
          printf("%s\n", p->key);
        }
        p = p->tail;
      }

      printf("OK\n");
      continue;
    }

    if (strncmp(line, "DEL ", 4) == 0) {
      char* key = NULL;
      sscanf(line, "DEL %ms\n", &key);
      store = prepend(key, NULL, store);
      printf("OK\n");
      continue;
    }

    if (strncmp(line, "PUT ", 4) == 0) {
      char* key = NULL;
      char* value = NULL;
      sscanf(line, "PUT %ms %ms\n", &key, &value);
      store = prepend(key, value, store);
      printf("OK\n");
      continue;
    }

    if (strncmp(line, "GET ", 4) == 0) {
      char* key = NULL;
      sscanf(line, "GET %ms\n", &key);

      char* value = lookup(store, key);

      if (value != NULL) {
        printf("%s\n", value);
        printf("OK\n");
      } else {
        printf("NOT OK\n");
      }
      continue;
    }

    if (strncmp(line, "QUIT\n", len) == 0) {
      printf("So long and thanks for all the fish.\n");
      printf("OK\n");
      break;
    }

    printf("NOT OK\n");
  }

  List* p = NULL;
  while (store != NULL) {
    p = store;
    store = store->tail;
    free(p->key);
    free(p->value);
    free(p);
  }

  printf("Run away Brave sir Robin\n");

  free(line);

  return 0;
}
