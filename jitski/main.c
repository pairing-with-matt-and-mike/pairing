#include <assert.h>
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <unistd.h>

// https://en.wikibooks.org/wiki/X86_Assembly/X86_Architecture
// http://www.c-jump.com/CIS77/CPU/x86/lecture.html#X77_0020_encoding_overview
// http://ref.x86asm.net/coder64-abc.html

typedef enum x86_opcode {
  X86_OPCODE_ADD,
  X86_OPCODE_MOV,
  X86_OPCODE_MOV_IMM32,
  X86_OPCODE_MOV_IMM64,
  X86_OPCODE_MOV_LOAD,
  X86_OPCODE_RET,
  X86_OPCODE_LABEL,
  X86_OPCODE_CALL,
  X86_OPCODE_CALL_REG,
} x86_opcode_t;

typedef enum x86_reg {
  X86_REG_RDI = 0b111, // scratch register
  X86_REG_RSI = 0b110, // scratch register
  X86_REG_RBP = 0b101, // base pointer / frame pointer
  X86_REG_RSP = 0b100, // stack pointer
  X86_REG_RBX = 0b011,
  X86_REG_RDX = 0b010, // scratch register
  X86_REG_RCX = 0b001, // scratch register
  X86_REG_RAX = 0b000  // scratch register
} x86_reg_t;

typedef struct x86_inst {
  x86_opcode_t opcode;
} x86_inst_t;

typedef struct x86_add {
  x86_opcode_t opcode;
  x86_reg_t dest;
  x86_reg_t src;
} x86_add_t;

typedef struct x86_mov {
  x86_opcode_t opcode;
  x86_reg_t dest;
  x86_reg_t src;
} x86_mov_t;

typedef struct x86_mov_imm32 {
  x86_opcode_t opcode;
  x86_reg_t dest;
  uint32_t src;
} x86_mov_imm32_t;

typedef struct x86_mov_imm64 {
  x86_opcode_t opcode;
  x86_reg_t dest;
  uint64_t src;
} x86_mov_imm64_t;

typedef struct x86_mov_load {
  x86_opcode_t opcode;
  x86_reg_t dest;
  x86_reg_t src_base;
  x86_reg_t src_index;
  uint8_t src_scale;
} x86_mov_load_t;

typedef struct x86_ret {
  x86_opcode_t opcode;
} x86_ret_t;

typedef struct x86_label {
  x86_opcode_t opcode;
  char* label;
} x86_label_t;

typedef struct x86_call {
  x86_opcode_t opcode;
  void* ptr;
} x86_call_t;

typedef struct x86_call_reg {
  x86_opcode_t opcode;
  x86_reg_t dest;
} x86_call_reg_t;

x86_inst_t* x86_add(x86_reg_t dest, x86_reg_t src) {
  x86_add_t* add = malloc(sizeof(x86_add_t));
  add->opcode = X86_OPCODE_ADD;
  add->dest = dest;
  add->src = src;
  return (x86_inst_t*) add;
}

x86_inst_t* x86_mov(x86_reg_t dest, x86_reg_t src) {
  x86_mov_t* mov = malloc(sizeof(x86_mov_t));
  mov->opcode = X86_OPCODE_MOV;
  mov->dest = dest;
  mov->src = src;
  return (x86_inst_t*) mov;
}

x86_inst_t* x86_mov_imm32(x86_reg_t dest, uint32_t src) {
  x86_mov_imm32_t* mov = malloc(sizeof(x86_mov_imm32_t));
  mov->opcode = X86_OPCODE_MOV_IMM32;
  mov->dest = dest;
  mov->src = src;
  return (x86_inst_t*) mov;
}

x86_inst_t* x86_mov_imm64(x86_reg_t dest, uint64_t src) {
  x86_mov_imm64_t* mov = malloc(sizeof(x86_mov_imm64_t));
  mov->opcode = X86_OPCODE_MOV_IMM64;
  mov->dest = dest;
  mov->src = src;
  return (x86_inst_t*) mov;
}

x86_inst_t* x86_mov_load(x86_reg_t dest,
                         x86_reg_t src_base,
                         x86_reg_t src_index,
                         uint8_t src_scale) {
  x86_mov_load_t* mov = malloc(sizeof(x86_mov_load_t));
  mov->opcode = X86_OPCODE_MOV_LOAD;
  mov->dest = dest;
  mov->src_base = src_base;
  mov->src_index = src_index;
  mov->src_scale = src_scale;
  return (x86_inst_t*) mov;
}

x86_inst_t* x86_ret() {
  x86_ret_t* ret = malloc(sizeof(x86_ret_t));
  ret->opcode = X86_OPCODE_RET;
  return (x86_inst_t*) ret;
}

x86_inst_t* x86_label(char* label) {
  x86_label_t* inst = malloc(sizeof(x86_label_t));
  inst->opcode = X86_OPCODE_LABEL;
  inst->label = label;
  return (x86_inst_t*) inst;
}

x86_inst_t* x86_call(void* ptr) {
  x86_call_t* inst = malloc(sizeof(x86_call_t));
  inst->opcode = X86_OPCODE_CALL;
  inst->ptr = ptr;
  return (x86_inst_t*) inst;
}

x86_inst_t* x86_call_reg(x86_reg_t dest) {
  x86_call_reg_t* inst = malloc(sizeof(x86_call_reg_t));
  inst->opcode = X86_OPCODE_CALL_REG;
  inst->dest = dest;
  return (x86_inst_t*) inst;
}

void* functions[100];

size_t assemble_inst(x86_inst_t* inst, char* output) {
  switch (inst->opcode) {
  case X86_OPCODE_ADD:
    x86_add_t* add = (x86_add_t*) inst;
    output[0] = 0x01;
    output[1] = (0b11 << 6) | (add->src << 3) | add->dest;
    return 2;
  case X86_OPCODE_CALL:
    x86_call_t* call = (x86_call_t*) inst;
    output[0] = 0xe8;
    ssize_t offset = ((ssize_t)call->ptr) - (((ssize_t)output) + 5);
    assert(offset >= INT32_MIN && offset <= INT32_MAX);
    *((int32_t*)&output[1]) = offset;
    return 5;
  case X86_OPCODE_CALL_REG:
    x86_call_reg_t* call_reg = (x86_call_reg_t*) inst;
    output[0] = 0xff;
    output[1] = (0b11 << 6) | (0x2 << 3) | call_reg->dest;
    return 2;
  case X86_OPCODE_LABEL:
    return 0;
  case X86_OPCODE_MOV:
    x86_mov_t* mov = (x86_mov_t*) inst;
    output[0] = 0x89;
    output[1] = (0b11 << 6) | (mov->src << 3) | mov->dest;
    return 2;
  case X86_OPCODE_MOV_IMM32:
    x86_mov_imm32_t* mov_imm32 = (x86_mov_imm32_t*) inst;
    output[0] = 0xc7;
    output[1] = (0b11 << 6) | (mov_imm32->dest);
    *((uint32_t*)&output[2]) = mov_imm32->src;
    return 6;
  case X86_OPCODE_MOV_IMM64:
    x86_mov_imm64_t* mov_imm64 = (x86_mov_imm64_t*) inst;
    output[0] = 0x48;
    output[1] = 0xb8 + mov_imm64->dest;
    *((uint64_t*)&output[2]) = mov_imm64->src;
    return 10;
  case X86_OPCODE_MOV_LOAD:
    x86_mov_load_t* mov_load = (x86_mov_load_t*) inst;
    output[0] = 0x48;
    output[1] = 0x8b;
    output[2] = (0b00 << 6) | (mov_load->dest << 3) | 0b100;
    output[3] = (mov_load->src_scale << 6) | (mov_load->src_index << 3) | (mov_load->src_base);
    return 4;
  case X86_OPCODE_RET:
    output[0] = 0xc3;
    return 1;
  default:
    return 0;
  }
}

void* assemble(x86_inst_t** instructions) {
  int pagesize = getpagesize();
  char* m = mmap(NULL,
                 pagesize,
                 PROT_READ | PROT_WRITE | PROT_EXEC,
                 MAP_SHARED | MAP_ANONYMOUS,
                 -1,
                 0);

  size_t output_index = 0;
  for (size_t i = 0; instructions[i] != NULL; i++) {
    output_index += assemble_inst(instructions[i], &m[output_index]);
  }

  return m;
}

size_t FUNCTION_G = 0;
size_t FUNCTION_F = 1;

int main () {

  x86_inst_t* jit_call_instructions[] = {
    // jit_call()
    x86_mov_imm64(X86_REG_RAX, (uint64_t)functions),
    // mov rax, [functions + rdi * 8]
    x86_mov_load(X86_REG_RAX, X86_REG_RAX, X86_REG_RDI, 3), // TODO: constant
    x86_mov(X86_REG_RDI, X86_REG_RSI),
    x86_call_reg(X86_REG_RAX),
    x86_ret(),
    NULL,
  };

  void* jit_call = assemble(jit_call_instructions);

  x86_inst_t* f_instructions[] = {
    // f(a) { return g() + a; }
    x86_label("f"),
    x86_mov(X86_REG_RBX, X86_REG_RDI),
    x86_mov_imm32(X86_REG_RDI, FUNCTION_G),
    x86_call(jit_call),
    // x86_call(FUNCTION_G),
    x86_add(X86_REG_RAX, X86_REG_RBX),
    x86_ret(),
    NULL,
  };

  x86_inst_t* g_instructions[] = {
    // g() { return 10; }
    x86_label("g"),
    x86_mov_imm32(X86_REG_RAX, 10),
    x86_ret(),
    NULL,
  };

  // TODO:
  // instructions[FUNCTION_F] = f_instructions;
  // instructions[FUNCTION_G] = g_instructions;

  void* g = assemble(g_instructions);
  functions[FUNCTION_G] = g;
  void* f = assemble(f_instructions);
  functions[FUNCTION_F] = f;

  uint64_t (*jit)(size_t, uint64_t) = (uint64_t (*)(size_t, uint64_t)) jit_call;

  uint64_t result = jit(FUNCTION_F, 3);
  printf("%lu\n", result);

  return 0;
}
