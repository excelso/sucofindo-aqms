<div class="form-group-control bg-white">
    <select class="form-control select2-custom {{ $class }}" name="{{ $name }}" id="{{ $id }}" {{ $disabled }} data-selected="{{ $selected }}">
        @if($options != null)
            @if(count($options) != 0)
                @foreach($options as $item)
                    @php($select = $item->year == $selected ? 'selected' : '')
                    <option value="{{ $item->year }}" {{ $select }}>{{ $item->year }}</option>
                @endforeach
            @else
                @for($i = date('Y'); $i <= date('Y'); $i++)
                    @php($select = $i == $selected ? 'selected' : '')
                    <option value="{{ $i }}" {{ $select }}>{{ $i }}</option>
                @endfor
            @endif
        @endif
    </select>
</div>
